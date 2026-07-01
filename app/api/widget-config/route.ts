import { NextResponse } from "next/server";
import { getPublicConfig } from "@/lib/config";

// Fetched cross-origin by widget.js running on the client's website,
// so it needs permissive CORS.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, max-age=300",
};

export function GET() {
  return NextResponse.json(getPublicConfig(), { headers: corsHeaders });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
