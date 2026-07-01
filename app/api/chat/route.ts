import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getModel } from "@/lib/config";
import { buildSystemPrompt, buildLeadTool } from "@/lib/prompt";
import { getBot, saveLead, logConversationTurns } from "@/lib/store";
import { notifyLead } from "@/lib/notify";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic();

const MAX_TOOL_ITERATIONS = 3;

interface ChatRequestBody {
  botId: string;
  sessionId: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

function isValidBody(body: unknown): body is ChatRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.botId === "string" &&
    b.botId.length > 0 &&
    b.botId.length <= 100 &&
    typeof b.sessionId === "string" &&
    b.sessionId.length > 0 &&
    b.sessionId.length <= 100 &&
    Array.isArray(b.messages) &&
    b.messages.length > 0 &&
    b.messages.every(
      (m) =>
        m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length > 0
    )
  );
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const bot = await getBot(body.botId).catch(() => null);
  if (!bot) {
    return NextResponse.json({ error: "Unknown bot" }, { status: 404 });
  }

  const cfg = bot.config;
  const fallbackReply = `Sorry, I'm having a little trouble right now. Please give us a call at ${cfg.business.phone} and a real human will help you out!`;

  const lastMessage = body.messages[body.messages.length - 1];
  if (lastMessage.role !== "user") {
    return NextResponse.json(
      { error: "Last message must be from the user" },
      { status: 400 }
    );
  }

  // Guardrail: hard cap on message length, enforced server-side.
  if (lastMessage.content.length > cfg.bot.maxUserMessageLength) {
    return NextResponse.json(
      {
        reply: `That message is a bit long for me! Could you keep it under ${cfg.bot.maxUserMessageLength} characters?`,
      },
      { status: 200 }
    );
  }

  // Guardrail: cap history and defensively truncate old messages so a
  // tampered client can't inflate the prompt.
  const history = body.messages
    .slice(-cfg.bot.maxHistoryMessages)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, cfg.bot.maxUserMessageLength * 4),
    }));

  const system: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: buildSystemPrompt(cfg),
      // The prompt is deterministic per bot config, so it caches well.
      cache_control: { type: "ephemeral" },
    },
  ];
  const tools = [buildLeadTool(cfg)];

  let messages: Anthropic.MessageParam[] = history;

  try {
    let response = await client.messages.create({
      model: getModel(cfg),
      max_tokens: cfg.bot.maxResponseTokens,
      system,
      tools,
      messages,
    });

    // Tool-use loop: execute capture_lead calls, feed results back.
    let iterations = 0;
    while (response.stop_reason === "tool_use" && iterations < MAX_TOOL_ITERATIONS) {
      iterations += 1;
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;

        if (block.name === "capture_lead") {
          const input = block.input as {
            name?: string;
            phone?: string;
            party_size?: number;
            event_date?: string;
            event_type?: string;
            notes?: string;
          };
          try {
            const lead = await saveLead(bot.id, {
              name: String(input.name ?? "").slice(0, 200),
              phone: String(input.phone ?? "").slice(0, 50),
              partySize: Number(input.party_size) || 0,
              eventDate: String(input.event_date ?? "").slice(0, 200),
              eventType: input.event_type
                ? String(input.event_type).slice(0, 200)
                : undefined,
              notes: input.notes ? String(input.notes).slice(0, 1000) : undefined,
              sessionId: body.sessionId,
            });
            await notifyLead(bot, lead);
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: "Lead saved. The team has been notified and will follow up.",
            });
          } catch (err) {
            console.error(`[chat] failed to save lead (bot ${bot.id}):`, err);
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: `Could not save the lead due to a technical problem. Apologize and ask the visitor to call ${cfg.business.phone} directly.`,
              is_error: true,
            });
          }
        } else {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: "Unknown tool.",
            is_error: true,
          });
        }
      }

      messages = [
        ...messages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ];

      response = await client.messages.create({
        model: getModel(cfg),
        max_tokens: cfg.bot.maxResponseTokens,
        system,
        tools,
        messages,
      });
    }

    const reply =
      response.content
        .filter(
          (b): b is Anthropic.TextBlock => b.type === "text" && b.text.trim().length > 0
        )
        .map((b) => b.text)
        .join("\n\n") || fallbackReply;

    // Log the exchange for the dashboard; never block the reply on it.
    const now = new Date().toISOString();
    logConversationTurns(bot.id, body.sessionId, [
      { role: "user", content: lastMessage.content, at: now },
      { role: "assistant", content: reply, at: now },
    ]).catch((err) => console.error("[chat] failed to log conversation:", err));

    return NextResponse.json({ reply });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("[chat] invalid or missing ANTHROPIC_API_KEY");
    } else if (err instanceof Anthropic.RateLimitError) {
      console.error("[chat] rate limited by the Anthropic API");
    } else if (err instanceof Anthropic.APIConnectionError) {
      console.error("[chat] could not reach the Anthropic API:", err.message);
    } else if (err instanceof Anthropic.APIError) {
      console.error(`[chat] Anthropic API error ${err.status}:`, err.message);
    } else {
      console.error("[chat] unexpected error:", err);
    }
    return NextResponse.json({ reply: fallbackReply }, { status: 200 });
  }
}
