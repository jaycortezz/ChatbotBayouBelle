import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getBot } from "@/lib/store";
import BotEditor from "./BotEditor";

export const dynamic = "force-dynamic";

export default async function BotEditPage({ params }: { params: { botId: string } }) {
  const bot = await getBot(params.botId).catch(() => null);
  if (!bot) notFound();

  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  return <BotEditor initialBot={bot} origin={origin} />;
}
