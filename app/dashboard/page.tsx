import Link from "next/link";
import { listBots, countLeads, storageBackendName } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const bots = await listBots().catch(() => []);
  const leadCounts = await Promise.all(
    bots.map((b) => countLeads(b.id).catch(() => 0))
  );

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32 }}>Chatbots</h1>
        <Link
          href="/dashboard/new"
          style={{
            background: "#C2451E",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          + New chatbot
        </Link>
      </div>
      <p style={{ color: "#8a7a68", fontSize: 13, marginBottom: 32 }}>
        Storage backend: {storageBackendName()}
      </p>

      {bots.length === 0 ? (
        <div
          style={{
            border: "2px dashed #ddd0bb",
            borderRadius: 12,
            padding: "60px 24px",
            textAlign: "center",
            color: "#8a7a68",
          }}
        >
          <p style={{ fontSize: 18, marginBottom: 8 }}>No chatbots yet.</p>
          <p style={{ fontSize: 14 }}>
            Create your first one — it starts from the Bayou Belle&apos;s demo
            template so it works immediately.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {bots.map((bot, i) => (
            <div
              key={bot.id}
              style={{
                border: "1px solid #eee3d0",
                borderRadius: 12,
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div
                aria-hidden
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: bot.config.branding.accentColor,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Georgia, serif",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {bot.config.business.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 17, fontWeight: 600 }}>
                  {bot.config.business.name}
                </div>
                <div style={{ fontSize: 12.5, color: "#8a7a68" }}>
                  {bot.id} · updated {bot.updatedAt.slice(0, 16).replace("T", " ")} ·{" "}
                  {leadCounts[i]} lead{leadCounts[i] === 1 ? "" : "s"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href={`/dashboard/${bot.id}`} style={btn}>
                  Edit
                </Link>
                <Link href={`/dashboard/${bot.id}/leads`} style={btn}>
                  Leads
                </Link>
                <a href={`/demo/${bot.id}`} target="_blank" style={btn}>
                  Demo ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

const btn: React.CSSProperties = {
  border: "1px solid #ddd0bb",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 13.5,
  textDecoration: "none",
  color: "#2d2118",
};
