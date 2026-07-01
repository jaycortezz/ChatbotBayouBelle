import { getConfig } from "@/lib/config";
import { listLeads, listConversations, storageBackendName } from "@/lib/store";

// Protected by HTTP Basic Auth in middleware.ts (ADMIN_PASSWORD).
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cfg = getConfig();
  const accent = cfg.branding.accentColor;
  const [leads, conversations] = await Promise.all([
    listLeads().catch(() => []),
    listConversations().catch(() => []),
  ]);

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "40px 24px 80px",
        background: "#fff",
      }}
    >
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, marginBottom: 4 }}>
        {cfg.business.name} — Admin
      </h1>
      <p style={{ color: "#8a7a68", fontSize: 13, marginBottom: 32 }}>
        Storage backend: {storageBackendName()}
      </p>

      <h2 style={{ fontSize: 20, marginBottom: 12, color: accent }}>
        Leads ({leads.length})
      </h2>
      {leads.length === 0 ? (
        <p style={{ color: "#8a7a68", marginBottom: 40 }}>
          No leads captured yet. Ask the bot about catering to create one.
        </p>
      ) : (
        <div style={{ overflowX: "auto", marginBottom: 40 }}>
          <table
            style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}
          >
            <thead>
              <tr>
                {["When", "Name", "Phone", "Party", "Date", "Type", "Notes"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "8px 10px",
                        borderBottom: `2px solid ${accent}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td style={cell} title={lead.createdAt}>
                    {lead.createdAt.slice(0, 16).replace("T", " ")}
                  </td>
                  <td style={cell}>{lead.name}</td>
                  <td style={cell}>{lead.phone}</td>
                  <td style={cell}>{lead.partySize}</td>
                  <td style={cell}>{lead.eventDate}</td>
                  <td style={cell}>{lead.eventType || "—"}</td>
                  <td style={{ ...cell, maxWidth: 260 }}>{lead.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ fontSize: 20, marginBottom: 12, color: accent }}>
        Recent conversations ({conversations.length})
      </h2>
      {conversations.length === 0 ? (
        <p style={{ color: "#8a7a68" }}>No conversations logged yet.</p>
      ) : (
        conversations.map((convo) => (
          <details
            key={convo.sessionId}
            style={{
              border: "1px solid #eee3d0",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 10,
            }}
          >
            <summary style={{ cursor: "pointer", fontSize: 14 }}>
              <strong>{convo.updatedAt.slice(0, 16).replace("T", " ")}</strong>
              {"  ·  "}
              {convo.turns.length} messages · session {convo.sessionId.slice(0, 18)}…
            </summary>
            <div style={{ marginTop: 12 }}>
              {convo.turns.map((turn, i) => (
                <p key={i} style={{ fontSize: 13.5, lineHeight: 1.6, margin: "6px 0" }}>
                  <strong
                    style={{ color: turn.role === "user" ? "#2d2118" : accent }}
                  >
                    {turn.role === "user" ? "Visitor" : cfg.branding.botName}:
                  </strong>{" "}
                  {turn.content}
                </p>
              ))}
            </div>
          </details>
        ))
      )}
    </main>
  );
}

const cell: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #eee3d0",
  verticalAlign: "top",
};
