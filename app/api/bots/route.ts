import { NextResponse } from "next/server";
import { validateBotConfig } from "@/lib/validate";
import { createBot, listBots } from "@/lib/store";

// Protected by HTTP Basic Auth in middleware.ts.
export const runtime = "nodejs";

export async function GET() {
  const bots = await listBots();
  return NextResponse.json({
    bots: bots.map((b) => ({
      id: b.id,
      name: b.config.business.name,
      industry: b.config.business.industry,
      accentColor: b.config.branding.accentColor,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    })),
  });
}

/** Body: { config: BotConfig } — the wizard sends a full, validated config. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { config?: unknown } | null;
  if (!body?.config) {
    return NextResponse.json({ error: "Missing 'config' in body." }, { status: 400 });
  }

  const result = validateBotConfig(body.config);
  if (!result.ok) {
    return NextResponse.json({ error: "Invalid config", errors: result.errors }, { status: 400 });
  }

  const bot = await createBot(result.config);
  return NextResponse.json({ bot }, { status: 201 });
}
