"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewBotPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [accentColor, setAccentColor] = useState("#C2451E");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, accentColor }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to create bot (${res.status}).`);
        setBusy(false);
        return;
      }
      router.push(`/dashboard/${data.bot.id}`);
    } catch {
      setError("Network error — try again.");
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px 80px" }}>
      <Link href="/dashboard" style={{ fontSize: 13.5, color: "#8a7a68" }}>
        ← Back to dashboard
      </Link>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, margin: "16px 0 8px" }}>
        New chatbot
      </h1>
      <p style={{ color: "#5a4a3a", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
        The bot starts from the demo template (Bayou Belle&apos;s menu, hours,
        catering info) so it works immediately — replace the knowledge base in
        the editor on the next screen.
      </p>

      <form onSubmit={create} style={{ display: "grid", gap: 20 }}>
        <label style={{ display: "grid", gap: 6, fontSize: 14, fontWeight: 600 }}>
          Business name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            placeholder="Mario's Pizzeria"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 6, fontSize: 14, fontWeight: 600 }}>
          Accent color
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              style={{ width: 48, height: 38, border: "1px solid #ddd0bb", borderRadius: 6, padding: 2 }}
            />
            <input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              pattern="^#[0-9a-fA-F]{3,8}$"
              style={{ ...inputStyle, width: 120 }}
            />
          </div>
        </label>

        {error && (
          <p style={{ color: "#b3261e", fontSize: 13.5, whiteSpace: "pre-wrap" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={busy || !name.trim()}
          style={{
            background: "#C2451E",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
            opacity: busy || !name.trim() ? 0.6 : 1,
            justifySelf: "start",
          }}
        >
          {busy ? "Creating…" : "Create chatbot"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid #ddd0bb",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 14.5,
  fontWeight: 400,
};
