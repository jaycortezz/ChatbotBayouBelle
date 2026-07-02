import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_MODEL } from "@/lib/config";

// Protected by HTTP Basic Auth in middleware.ts — this is a dashboard-only
// tool for drafting a bot's knowledge base from the client's own website.
export const runtime = "nodejs";
export const maxDuration = 45;

const client = new Anthropic();

const MAX_FETCH_BYTES = 400_000;
const MAX_EXTRACT_CHARS = 12_000;
const FETCH_TIMEOUT_MS = 12_000;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { url?: string } | null;
  const rawUrl = body?.url?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "A URL is required." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("bad protocol");
  } catch {
    return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
  }
  if (isBlockedHost(parsed)) {
    return NextResponse.json({ error: "That URL isn't allowed." }, { status: 400 });
  }

  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(parsed.toString(), {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "CortezChatbotsTrainer/1.0 (+https://cortezchatbots.com)",
        },
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not fetch that page (HTTP ${res.status}).` },
        { status: 400 }
      );
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("html") && !contentType.includes("text")) {
      return NextResponse.json(
        { error: "That URL doesn't look like a web page (unexpected content type)." },
        { status: 400 }
      );
    }
    html = await readCapped(res, MAX_FETCH_BYTES);
  } catch (err) {
    console.error("[train] fetch failed:", err);
    return NextResponse.json(
      { error: "Couldn't reach that URL. Check it's correct and publicly accessible." },
      { status: 400 }
    );
  }

  const text = extractText(html).slice(0, MAX_EXTRACT_CHARS);
  if (text.length < 100) {
    return NextResponse.json(
      { error: "Couldn't find enough readable text on that page. Try a different page." },
      { status: 400 }
    );
  }

  try {
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: 3000,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Source URL: ${parsed.toString()}\n\nPage text:\n"""\n${text}\n"""` }],
    });
    const raw = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text || "";
    const draft = parseDraftJson(raw);
    if (!draft) {
      return NextResponse.json(
        {
          error:
            "The AI couldn't extract structured info from that page. Try a different page (e.g. an About or Services page), or fill in the details manually.",
        },
        { status: 502 }
      );
    }
    return NextResponse.json({ draft });
  } catch (err) {
    console.error("[train] extraction failed:", err);
    return NextResponse.json({ error: "AI extraction failed. Try again in a moment." }, { status: 502 });
  }
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return res.text();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  reader.cancel().catch(() => {});
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6])\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const EXTRACTION_SYSTEM_PROMPT = `You extract structured business information from raw website text to seed a customer-facing chatbot. Read the page text and respond with ONLY a single JSON object (no markdown fences, no commentary before or after) matching exactly this shape:

{
  "business": { "name": string, "tagline": string, "phone": string, "email": string, "address": { "street": string, "city": string, "state": string, "zip": string } },
  "brandVoice": { "whatYouDo": string, "targetAudience": string, "differentiators": string },
  "hours": { "schedule": { "<Day>": "<hours text>" }, "notes": string },
  "knowledgeSections": [ { "title": string, "content": string } ],
  "faqs": [ { "q": string, "a": string } ]
}

Rules:
- Use "" for any string field you can't find on the page. Use {} or [] for empty objects/arrays.
- knowledgeSections: create 2-6 sections grouping what the business actually offers (services, products, pricing, process, policies) using ONLY information present in the text. Never invent prices, hours, or policies that aren't in the text.
- faqs: only include questions the page text actually answers.
- hours.schedule: only include if the page states specific hours; leave {} otherwise.
- Keep each field concise and written for a visitor, not marketing copy.`;

function parseDraftJson(raw: string): unknown | null {
  const cleaned = raw
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** Basic SSRF guard: block loopback/private/link-local targets. */
function isBlockedHost(u: URL): boolean {
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host === "0.0.0.0" || host.endsWith(".local")) return true;
  if (host === "169.254.169.254" || host === "::1") return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
  }
  return false;
}
