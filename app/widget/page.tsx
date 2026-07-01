import { getPublicConfig } from "@/lib/config";
import { getBot } from "@/lib/store";
import ChatWidget from "./ChatWidget";

export const dynamic = "force-dynamic";

/** The page loaded inside the widget iframe: /widget?bot=BOT_ID */
export default async function WidgetPage({
  searchParams,
}: {
  searchParams: { bot?: string };
}) {
  const bot = searchParams.bot ? await getBot(searchParams.bot).catch(() => null) : null;

  if (!bot) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100dvh",
          padding: 24,
          textAlign: "center",
          color: "#5a4a3a",
          background: "#FBF6EC",
          fontSize: 14,
        }}
      >
        This chat widget isn&apos;t configured correctly (unknown bot ID).
      </div>
    );
  }

  return <ChatWidget config={getPublicConfig(bot.config)} botId={bot.id} />;
}
