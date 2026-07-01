import Script from "next/script";
import { notFound } from "next/navigation";
import { getBot } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Public demo page for a bot. It embeds the widget exactly the way a client
 * website would — with the single <script data-bot> tag — so it exercises
 * the full embed path. Share this URL with the client to preview their bot.
 */
export default async function DemoPage({ params }: { params: { botId: string } }) {
  const bot = await getBot(params.botId).catch(() => null);
  if (!bot) notFound();

  const cfg = bot.config;
  const accent = cfg.branding.accentColor;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F1E5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          textTransform: "uppercase",
          letterSpacing: "0.3em",
          fontSize: 13,
          color: accent,
          marginBottom: 16,
        }}
      >
        {cfg.business.tagline}
      </p>
      <h1
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "clamp(40px, 8vw, 72px)",
          color: "#2d2118",
          marginBottom: 24,
        }}
      >
        {cfg.business.name}
      </h1>
      <p style={{ maxWidth: 520, lineHeight: 1.7, color: "#5a4a3a" }}>
        This is the live preview of the chatbot widget — the bubble in the
        bottom-right corner is embedded exactly as it will be on the real
        website. Try asking about hours, the menu, dietary options, parking,
        or catering for a large party.
      </p>

      <Script src="/widget.js" data-bot={bot.id} strategy="afterInteractive" />
    </main>
  );
}
