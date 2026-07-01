import { promises as fs } from "fs";
import path from "path";

/**
 * Lead + conversation store with two backends:
 *
 * 1. Upstash Redis (set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN) —
 *    persistent, the right choice on Vercel. Uses the REST API directly, so
 *    no extra dependency is needed.
 * 2. Local JSON files — zero-setup fallback for local dev. On Vercel this
 *    lands in /tmp, which is EPHEMERAL (wiped on redeploy/idle); notification
 *    emails/webhooks still fire, but the admin list won't persist.
 */

export interface Lead {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  partySize: number;
  eventDate: string;
  eventType?: string;
  notes?: string;
  sessionId: string;
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function saveLead(
  input: Omit<Lead, "id" | "createdAt">
): Promise<Lead> {
  const lead: Lead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...input,
  };

  if (useRedis) {
    await redis(["LPUSH", "leads", JSON.stringify(lead)]);
  } else {
    const leads = await readJsonFile<Lead[]>("leads.json", []);
    leads.unshift(lead);
    await writeJsonFile("leads.json", leads);
  }
  return lead;
}

export async function listLeads(): Promise<Lead[]> {
  if (useRedis) {
    const raw = (await redis(["LRANGE", "leads", 0, MAX_LEADS_LISTED - 1])) as string[];
    return raw.map((s) => JSON.parse(s) as Lead);
  }
  const leads = await readJsonFile<Lead[]>("leads.json", []);
  return leads.slice(0, MAX_LEADS_LISTED);
}

export async function logConversationTurns(
  sessionId: string,
  turns: ConversationTurn[]
): Promise<void> {
  if (useRedis) {
    const existingRaw = (await redis(["HGET", "conversations", sessionId])) as
      | string
      | null;
    const convo: Conversation = existingRaw
      ? (JSON.parse(existingRaw) as Conversation)
      : { sessionId, updatedAt: "", turns: [] };
    convo.turns = [...convo.turns, ...turns].slice(-MAX_TURNS_PER_CONVERSATION);
    convo.updatedAt = new Date().toISOString();
    await redis(["HSET", "conversations", sessionId, JSON.stringify(convo)]);
    return;
  }

  const conversations = await readJsonFile<Record<string, Conversation>>(
    "conversations.json",
    {}
  );
  const convo = conversations[sessionId] || { sessionId, updatedAt: "", turns: [] };
  convo.turns = [...convo.turns, ...turns].slice(-MAX_TURNS_PER_CONVERSATION);
  convo.updatedAt = new Date().toISOString();
  conversations[sessionId] = convo;
  await writeJsonFile("conversations.json", conversations);
}

export async function listConversations(): Promise<Conversation[]> {
  let all: Conversation[];
  if (useRedis) {
    // HGETALL returns a flat [field, value, field, value, ...] array
    const flat = (await redis(["HGETALL", "conversations"])) as string[];
    all = [];
    for (let i = 1; i < flat.length; i += 2) {
      all.push(JSON.parse(flat[i]) as Conversation);
    }
  } else {
    const map = await readJsonFile<Record<string, Conversation>>(
      "conversations.json",
      {}
    );
    all = Object.values(map);
  }
  return all
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_CONVERSATIONS_LISTED);
}

export function storageBackendName(): string {
  return useRedis ? "Upstash Redis" : `local file store (${dataDir})`;
}
