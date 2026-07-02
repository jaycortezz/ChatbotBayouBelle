export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7FB",
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
          color: "#4F46E5",
          marginBottom: 16,
        }}
      >
        AI chat widgets for any business
      </p>
      <h1
        style={{
          fontSize: "clamp(36px, 7vw, 64px)",
          color: "#1c1c24",
          marginBottom: 24,
        }}
      >
        Cortez Chatbots
      </h1>
      <p style={{ maxWidth: 560, lineHeight: 1.7, color: "#4b4b57", marginBottom: 32 }}>
        Create a branded AI chatbot for any client — train it on their website in one click,
        tune its brand voice, embed it with a single script tag, and collect leads — all managed
        from one dashboard.
      </p>
      <a
        href="/dashboard"
        style={{
          background: "#4F46E5",
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
