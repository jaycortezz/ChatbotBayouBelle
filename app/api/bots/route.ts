import { NextResponse } from "next/server";
import { getTemplateConfig } from "@/lib/config";
import { createBot, listBots } from "@/lib/store";

// Protected by HTTP Basic Auth in middleware.ts.
export const runtime = "nodejs";

export async function GET() {
  const bots = await listBots();
  return NextResponse.json({
    bots: bots.map((b) => ({
      id: b.id,
      name: b.config.business.name,
      accentColor: b.config.branding.accentColor,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    })),
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    name?: string;
    accentColor?: string;
  } | null;

  const name = body?.name?.trim();
  if (!name || name.length > 100) {
    return NextResponse.json(
      { error: "A business name (1-100 characters) is required." },
      { status: 400 }
    );
  }

  const accentColor = body?.accentColor?.trim();
  if (accentColor && !/^#[0-9a-fA-F]{3,8}$/.test(accentColor)) {
    return NextResponse.json(
      { error: "accentColor must be a hex color like #C2451E." },
      { status: 400 }
    );
  }

  // New bots start from the template with generic branding; the demo
  // knowledge base (menu, hours, etc.) stays in as working example content
  // to replace in the editor.
  const config = getTemplateConfig();
  config.business.name = name;
  if (accentColor) config.branding.accentColor = accentColor;
  config.branding.botName = "Assistant";
  config.branding.greeting = `Hi there! Welcome to ${name}. I can help with our menu, hours, catering, big parties, parking — whatever you need. How can I help?`;

  const bot = await createBot(config);
  return NextResponse.json({ bot }, { status: 201 });
}
