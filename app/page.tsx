export default function Home() {
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
          color: "#C2451E",
          marginBottom: 16,
        }}
      >
        AI chat widgets for restaurants
      </p>
      <h1
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "clamp(36px, 7vw, 64px)",
          color: "#2d2118",
          marginBottom: 24,
        }}
      >
        Chatbot Platform
      </h1>
      <p style={{ maxWidth: 560, lineHeight: 1.7, color: "#5a4a3a", marginBottom: 32 }}>
        Create a branded AI chatbot per client, embed it on their website with a
        single script tag, and collect catering &amp; large-party leads — all
        managed from one dashboard.
      </p>
      <a
        href="/dashboard"
        style={{
          background: "#C2451E",
          color: "#fff",
          padding: "14px 32px",
          borderRadius: 8,
          textDecoration: "none",
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        Open dashboard →
      </a>
    </main>
  );
}
