import Script from "next/script";
import { getConfig } from "@/lib/config";

/**
 * Demo landing page. It embeds the widget exactly the way a client website
 * would — with the single <script> tag — so you can test the full embed
 * path, not just the /widget page.
 */
export default function Home() {
  const cfg = getConfig();
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
      <p style={{ maxWidth: 520, lineHeight: 1.7, color: "#5a4a3a", marginBottom: 12 }}>
        This is the demo page for the chatbot widget. The floating chat bubble in
        the bottom-right corner is embedded with the same single{" "}
        <code style={{ background: "#eee3d0", padding: "2px 6px", borderRadius: 4 }}>
          &lt;script&gt;
        </code>{" "}
        tag a client site would use.
      </p>
      <p style={{ maxWidth: 520, lineHeight: 1.7, color: "#5a4a3a" }}>
        Try asking about hours, the menu, gluten-free options, parking — or say
        you want catering for 40 people to see lead capture in action. Captured
        leads show up on the <a href="/admin" style={{ color: accent }}>/admin</a>{" "}
        dashboard.
      </p>

      {/* The one-line embed. On a client's website this src would be the
          full deployment URL, e.g. https://your-app.vercel.app/widget.js */}
      <Script src="/widget.js" strategy="afterInteractive" />
    </main>
  );
}
