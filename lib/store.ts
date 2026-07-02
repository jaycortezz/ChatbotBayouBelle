import { promises as fs } from "fs";
import path from "path";
import type { BotConfig } from "./config";

/**
 * Platform store: bots, plus per-bot leads and conversations.
 *
 * Two backends:
 * 1. Upstash Redis (set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN) —
 *    persistent; effectively REQUIRED in production on Vercel, since bot
 *    configs themselves live here. Uses the REST API directly (no SDK).
 * 2. Local JSON files — zero-setup fallback for local dev. On Vercel this
 *    lands in /tmp, which is EPHEMERAL: bots, leads, and conversations are
 *    wiped on redeploy/idle.
 */

export interface BotNotifications {
  emailTo?: string;
  webhookUrl?: string;
}

export interface Bot {
  id: string;
  createdAt: string;
  updatedAt: string;
  config: BotConfig;
  notifications: BotNotifications;
}

/**
 * A captured lead. `fields` is keyed by the bot's configured lead-field
 * keys (leadCapture.fields[].key), so its shape varies per bot/industry —
 * a cleaning company might have {name, phone, address}, a law firm
 * {name, email, caseType}. Look up labels via the bot's leadCapture.fields.
 */
export interface Lead {
  id: string;
  createdAt: string;
  sessionId: string;
  fields: Record<string, string>;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface Conversation {
  sessionId: string;
  updatedAt: string;
  turns: ConversationTurn[];
}

const MAX_LEADS_LISTED = 200;
const MAX_CONVERSATIONS_LISTED = 50;
const MAX_TURNS_PER_CONVERSATION = 40;

// ---------------------------------------------------------------------------
// Upstash Redis backend (REST, no SDK)
// ---------------------------------------------------------------------------

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = Boolean(redisUrl && redisToken);

async function redis(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(redisUrl as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (!res.ok || json.error) {
    throw new Error(`Redis error: ${json.error || res.status}`);
  }
  return json.result;
}

/** HGETALL returns a flat [field, value, ...] array; parse the values. */
function parseHgetallValues<T>(flat: string[]): T[] {
  const out: T[] = [];
  for (let i = 1; i < flat.length; i += 2) out.push(JSON.parse(flat[i]) as T);
  return out;
}

// ---------------------------------------------------------------------------
// File backend
// ---------------------------------------------------------------------------

const dataDir =
  process.env.DATA_DIR ||
  (process.env.VERCEL ? "/tmp/chatbot-data" : path.join(process.cwd(), ".data"));

async function readJsonFile<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(dataDir, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(file: string, data: unknown): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, file), JSON.stringify(data, null, 2), "utf8");
}

type BotsFile = Record<string, Bot>;
type LeadsFile = Record<string, Lead[]>;
type ConversationsFile = Record<string, Record<string, Conversation>>;

// ---------------------------------------------------------------------------
// Bots
// ---------------------------------------------------------------------------

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function createBot(
  config: BotConfig,
  notifications: BotNotifications = {}
): Promise<Bot> {
  const now = new Date().toISOString();
  const bot: Bot = { id: newId("bot"), createdAt: now, updatedAt: now, config, notifications };

  if (useRedis) {
    await redis(["HSET", "bots", bot.id, JSON.stringify(bot)]);
  } else {
    const bots = await readJsonFile<BotsFile>("bots.json", {});
    bots[bot.id] = bot;
    await writeJsonFile("bots.json", bots);
  }
  return bot;
}

export async function getBot(id: string): Promise<Bot | null> {
  if (!id || id.length > 100) return null;
  if (useRedis) {
    const raw = (await redis(["HGET", "bots", id])) as string | null;
    return raw ? (JSON.parse(raw) as Bot) : null;
  }
  const bots = await readJsonFile<BotsFile>("bots.json", {});
  return bots[id] || null;
}

export async function listBots(): Promise<Bot[]> {
  let all: Bot[];
  if (useRedis) {
    const flat = (await redis(["HGETALL", "bots"])) as string[];
    all = parseHgetallValues<Bot>(flat);
  } else {
    const bots = await readJsonFile<BotsFile>("bots.json", {});
    all = Object.values(bots);
  }
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function updateBot(
  id: string,
  updates: { config: BotConfig; notifications: BotNotifications }
): Promise<Bot | null> {
  const existing = await getBot(id);
  if (!existing) return null;
  const bot: Bot = {
    ...existing,
    config: updates.config,
    notifications: updates.notifications,
    updatedAt: new Date().toISOString(),
  };
  if (useRedis) {
    await redis(["HSET", "bots", id, JSON.stringify(bot)]);
  } else {
    const bots = await readJsonFile<BotsFile>("bots.json", {});
    bots[id] = bot;
    await writeJsonFile("bots.json", bots);
  }
  return bot;
}

export async function deleteBot(id: string): Promise<void> {
  if (useRedis) {
    await redis(["HDEL", "bots", id]);
    await redis(["DEL", `leads:${id}`, `conversations:${id}`]);
    return;
  }
  const bots = await readJsonFile<BotsFile>("bots.json", {});
  delete bots[id];
  await writeJsonFile("bots.json", bots);

  const leads = await readJsonFile<LeadsFile>("leads.json", {});
  delete leads[id];
  await writeJsonFile("leads.json", leads);

  const convos = await readJsonFile<ConversationsFile>("conversations.json", {});
  delete convos[id];
  await writeJsonFile("conversations.json", convos);
}

// ---------------------------------------------------------------------------
// Leads (per bot)
// ---------------------------------------------------------------------------

export async function saveLead(
  botId: string,
  input: Omit<Lead, "id" | "createdAt">
): Promise<Lead> {
  const lead: Lead = { id: newId("lead"), createdAt: new Date().toISOString(), ...input };

  if (useRedis) {
    await redis(["LPUSH", `leads:${botId}`, JSON.stringify(lead)]);
  } else {
    const leads = await readJsonFile<LeadsFile>("leads.json", {});
    leads[botId] = [lead, ...(leads[botId] || [])];
    await writeJsonFile("leads.json", leads);
  }
  return lead;
}

export async function listLeads(botId: string): Promise<Lead[]> {
  if (useRedis) {
    const raw = (await redis(["LRANGE", `leads:${botId}`, 0, MAX_LEADS_LISTED - 1])) as string[];
    return raw.map((s) => JSON.parse(s) as Lead);
  }
  const leads = await readJsonFile<LeadsFile>("leads.json", {});
  return (leads[botId] || []).slice(0, MAX_LEADS_LISTED);
}

export async function countLeads(botId: string): Promise<number> {
  if (useRedis) {
    return Number(await redis(["LLEN", `leads:${botId}`])) || 0;
  }
  const leads = await readJsonFile<LeadsFile>("leads.json", {});
  return (leads[botId] || []).length;
}

// ---------------------------------------------------------------------------
// Conversations (per bot)
// ---------------------------------------------------------------------------

export async function logConversationTurns(
  botId: string,
  sessionId: string,
  turns: ConversationTurn[]
): Promise<void> {
  if (useRedis) {
    const key = `conversations:${botId}`;
    const existingRaw = (await redis(["HGET", key, sessionId])) as string | null;
    const convo: Conversation = existingRaw
      ? (JSON.parse(existingRaw) as Conversation)
      : { sessionId, updatedAt: "", turns: [] };
    convo.turns = [...convo.turns, ...turns].slice(-MAX_TURNS_PER_CONVERSATION);
    convo.updatedAt = new Date().toISOString();
    await redis(["HSET", key, sessionId, JSON.stringify(convo)]);
    return;
  }

  const all = await readJsonFile<ConversationsFile>("conversations.json", {});
  const forBot = all[botId] || {};
  const convo = forBot[sessionId] || { sessionId, updatedAt: "", turns: [] };
  convo.turns = [...convo.turns, ...turns].slice(-MAX_TURNS_PER_CONVERSATION);
  convo.updatedAt = new Date().toISOString();
  forBot[sessionId] = convo;
  all[botId] = forBot;
  await writeJsonFile("conversations.json", all);
}

export async function listConversations(botId: string): Promise<Conversation[]> {
  let all: Conversation[];
  if (useRedis) {
    const flat = (await redis(["HGETALL", `conversations:${botId}`])) as string[];
    all = parseHgetallValues<Conversation>(flat);
  } else {
    const map = await readJsonFile<ConversationsFile>("conversations.json", {});
    all = Object.values(map[botId] || {});
  }
  return all
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_CONVERSATIONS_LISTED);
}

export function storageBackendName(): string {
  return useRedis ? "Upstash Redis" : `local file store (${dataDir})`;
}
