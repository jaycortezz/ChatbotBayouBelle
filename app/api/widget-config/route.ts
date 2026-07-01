import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPublicConfig } from "@/lib/config";
import { getBot } from "@/lib/store";

// Fetched cross-origin by widget.js running on the client's website,
// so it needs permissive CORS.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, max-age=60",
};

export async function GET(req: NextRequest) {
  const botId = req.nextUrl.searchParams.get("bot");
  if (!botId) {
    return NextResponse.json(
      { error: "Missing ?bot=BOT_ID — add data-bot=\"BOT_ID\" to the widget script tag." },
      { status: 400, headers: corsHeaders }
    );
  }

  const bot = await getBot(botId).catch(() => null);
  if (!bot) {
    return NextResponse.json({ error: "Unknown bot" }, { status: 404, headers: corsHeaders });
  }

  return NextResponse.json(
    { botId: bot.id, ...getPublicConfig(bot.config) },
    { headers: corsHeaders }
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
