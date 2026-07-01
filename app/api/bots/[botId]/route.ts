import { NextResponse } from "next/server";
import { validateBotConfig } from "@/lib/validate";
import { getBot, updateBot, deleteBot, type BotNotifications } from "@/lib/store";

// Protected by HTTP Basic Auth in middleware.ts.
export const runtime = "nodejs";

interface Params {
  params: { botId: string };
}

export async function GET(_req: Request, { params }: Params) {
  const bot = await getBot(params.botId);
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bot });
}

export async function PUT(req: Request, { params }: Params) {
  const body = (await req.json().catch(() => null)) as {
    config?: unknown;
    notifications?: { emailTo?: string; webhookUrl?: string };
  } | null;

  if (!body || typeof body !== "object" || !body.config) {
    return NextResponse.json({ error: "Missing 'config' in body." }, { status: 400 });
  }

  const result = validateBotConfig(body.config);
  if (!result.ok) {
    return NextResponse.json({ error: "Invalid config", errors: result.errors }, { status: 400 });
  }

  const notifications: BotNotifications = {};
  const emailTo = body.notifications?.emailTo?.trim();
  const webhookUrl = body.notifications?.webhookUrl?.trim();
  if (emailTo) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo)) {
      return NextResponse.json({ error: "notifications.emailTo is not a valid email." }, { status: 400 });
    }
    notifications.emailTo = emailTo;
  }
  if (webhookUrl) {
    if (!/^https?:\/\//.test(webhookUrl)) {
      return NextResponse.json({ error: "notifications.webhookUrl must be an http(s) URL." }, { status: 400 });
    }
    notifications.webhookUrl = webhookUrl;
  }

  const bot = await updateBot(params.botId, { config: result.config, notifications });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bot });
}

export async function DELETE(_req: Request, { params }: Params) {
  const bot = await getBot(params.botId);
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteBot(params.botId);
  return NextResponse.json({ ok: true });
}
