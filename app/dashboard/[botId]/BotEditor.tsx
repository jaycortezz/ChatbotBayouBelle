"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Bot } from "@/lib/store";
import type { BotConfig } from "@/lib/config";

/**
 * Bot editor. Common fields (business, branding, notifications) are plain
 * form inputs; the knowledge base (hours, menu, catering, reservations,
 * parking, FAQs, bot settings) is edited as JSON and validated server-side
 * on save.
 */
export default function BotEditor({
  initialBot,
  origin,
}: {
  initialBot: Bot;
  origin: string;
}) {
  const router = useRouter();
  const cfg = initialBot.config;

  // Business
  const [name, setName] = useState(cfg.business.name);
  const [tagline, setTagline] = useState(cfg.business.tagline);
  const [phone, setPhone] = useState(cfg.business.phone);
  const [email, setEmail] = useState(cfg.business.email);
  const [street, setStreet] = useState(cfg.business.address.street);
  const [city, setCity] = useState(cfg.business.address.city);
  const [state, setState] = useState(cfg.business.address.state);
  const [zip, setZip] = useState(cfg.business.address.zip);
  const [directionsNote, setDirectionsNote] = useState(cfg.business.address.directionsNote);

  // Branding
  const [accentColor, setAccentColor] = useState(cfg.branding.accentColor);
  const [botName, setBotName] = useState(cfg.branding.botName);
  const [bubbleLabel, setBubbleLabel] = useState(cfg.branding.bubbleLabel);
  const [greeting, setGreeting] = useState(cfg.branding.greeting);

  // Notifications
  const [emailTo, setEmailTo] = useState(initialBot.notifications.emailTo || "");
  const [webhookUrl, setWebhookUrl] = useState(initialBot.notifications.webhookUrl || "");

  // Knowledge base JSON (everything the bot "knows" beyond contact info)
  const [knowledgeJson, setKnowledgeJson] = useState(() =>
    JSON.stringify(
      {
        hours: cfg.hours,
        menu: cfg.menu,
        catering: cfg.catering,
        reservations: cfg.reservations,
        parking: cfg.parking,
        faqs: cfg.faqs,
        bot: cfg.bot,
      },
      null,
      2
    )
  );

  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const embedSnippet = useMemo(
    () => `<script src="${origin}/widget.js" data-bot="${initialBot.id}" async></script>`,
    [origin, initialBot.id]
  );

  async function save() {
    if (busy) return;
    setStatus(null);

    let knowledge: Record<string, unknown>;
    try {
      knowledge = JSON.parse(knowledgeJson);
    } catch (e) {
      setStatus({ kind: "error", text: `Knowledge base isn't valid JSON: ${(e as Error).message}` });
      return;
    }

    const config: BotConfig = {
      business: {
        name,
        tagline,
        phone,
        email,
        address: { street, city, state, zip, directionsNote },
      },
      branding: { accentColor, bubbleLabel, greeting, botName },
      ...(knowledge as Pick<
        BotConfig,
        "hours" | "menu" | "catering" | "reservations" | "parking" | "faqs" | "bot"
      >),
    };

    setBusy(true);
    try {
      const res = await fetch(`/api/bots/${initialBot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, notifications: { emailTo, webhookUrl } }),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = Array.isArray(data.errors) ? `\n• ${data.errors.join("\n• ")}` : "";
        setStatus({ kind: "error", text: `${data.error || "Save failed"}${details}` });
      } else {
        setStatus({ kind: "ok", text: "Saved. Changes are live immediately." });
        router.refresh();
      }
    } catch {
      setStatus({ kind: "error", text: "Network error — try again." });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${name}" and all its leads/conversations? This can't be undone.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/bots/${initialBot.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setStatus({ kind: "error", text: "Delete failed." });
        setBusy(false);
      }
    } catch {
      setStatus({ kind: "error", text: "Network error — try again." });
      setBusy(false);
    }
  }

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(embedSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; the snippet is selectable
    }
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
      <Link href="/dashboard" style={{ fontSize: 13.5, color: "#8a7a68" }}>
        ← Back to dashboard
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "16px 0 4px",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30 }}>{name || "Chatbot"}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/dashboard/${initialBot.id}/leads`} style={linkBtn}>
            Leads
          </Link>
          <a href={`/demo/${initialBot.id}`} target="_blank" style={linkBtn}>
            Try it ↗
          </a>
        </div>
      </div>
      <p style={{ color: "#8a7a68", fontSize: 12.5, marginBottom: 28 }}>{initialBot.id}</p>

      {/* Embed snippet */}
      <Section title="Embed on the client's website">
        <p style={hint}>Paste this one line before &lt;/body&gt; on any site:</p>
        <div style={{ display: "flex", gap: 8, alignItems: "stretch", flexWrap: "wrap" }}>
          <code
            style={{
              flex: 1,
              minWidth: 260,
              background: "#2d2118",
              color: "#f5e9d5",
              padding: "12px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {embedSnippet}
          </code>
          <button onClick={copySnippet} style={{ ...button, background: "#2d2118" }}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </Section>

      {/* Business */}
      <Section title="Business">
        <Grid>
          <Field label="Business name" value={name} onChange={setName} />
          <Field label="Tagline" value={tagline} onChange={setTagline} />
          <Field label="Phone" value={phone} onChange={setPhone} />
          <Field label="Email" value={email} onChange={setEmail} />
          <Field label="Street" value={street} onChange={setStreet} />
          <Field label="City" value={city} onChange={setCity} />
          <Field label="State" value={state} onChange={setState} />
          <Field label="ZIP" value={zip} onChange={setZip} />
        </Grid>
        <Field
          label="Directions note (how to find the place)"
          value={directionsNote}
          onChange={setDirectionsNote}
          textarea
        />
      </Section>

      {/* Branding */}
      <Section title="Branding">
        <Grid>
          <label style={fieldLabel}>
            Accent color
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : "#C2451E"}
                onChange={(e) => setAccentColor(e.target.value)}
                style={{ width: 48, height: 38, border: "1px solid #ddd0bb", borderRadius: 6, padding: 2 }}
              />
              <input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                style={{ ...input, width: 110 }}
              />
            </div>
          </label>
          <Field label="Bot name (persona)" value={botName} onChange={setBotName} />
          <Field label="Bubble label (hover text)" value={bubbleLabel} onChange={setBubbleLabel} />
        </Grid>
        <Field label="Greeting (first message)" value={greeting} onChange={setGreeting} textarea />
      </Section>

      {/* Notifications */}
      <Section title="Lead notifications">
        <p style={hint}>
          Where to send new catering/large-party leads for this bot. Leave blank
          to fall back to the platform-wide defaults (env vars). Email requires
          RESEND_API_KEY to be set on the deployment.
        </p>
        <Grid>
          <Field label="Notification email" value={emailTo} onChange={setEmailTo} placeholder="owner@restaurant.com" />
          <Field label="Webhook URL" value={webhookUrl} onChange={setWebhookUrl} placeholder="https://hooks.zapier.com/..." />
        </Grid>
      </Section>

      {/* Knowledge base */}
      <Section title="Knowledge base (JSON)">
        <p style={hint}>
          Everything the bot knows: hours, menu with prices, catering,
          reservations, parking, FAQs, and bot settings (model &amp; limits).
          Edit freely — it's validated when you save. Anything not in here, the
          bot will decline to answer and give out the phone number instead.
        </p>
        <textarea
          value={knowledgeJson}
          onChange={(e) => setKnowledgeJson(e.target.value)}
          spellCheck={false}
          style={{
            width: "100%",
            minHeight: 420,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12.5,
            lineHeight: 1.5,
            border: "1px solid #ddd0bb",
            borderRadius: 8,
            padding: 14,
            background: "#FBF6EC",
          }}
        />
      </Section>

      {status && (
        <p
          style={{
            whiteSpace: "pre-wrap",
            fontSize: 13.5,
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 16,
            background: status.kind === "ok" ? "#e8f3e4" : "#fdeceb",
            color: status.kind === "ok" ? "#2e5d24" : "#b3261e",
          }}
        >
          {status.text}
        </p>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={save} disabled={busy} style={{ ...button, opacity: busy ? 0.6 : 1 }}>
          {busy ? "Working…" : "Save changes"}
        </button>
        <button
          onClick={remove}
          disabled={busy}
          style={{
            ...button,
            background: "transparent",
            color: "#b3261e",
            border: "1px solid #e6b6b2",
          }}
        >
          Delete bot
        </button>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        border: "1px solid #eee3d0",
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 20,
      }}
    >
      <h2 style={{ fontSize: 16, marginBottom: 14, color: "#C2451E" }}>{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 14,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <label style={fieldLabel}>
      {label}
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...input, resize: "vertical", fontFamily: "inherit" }}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={input}
        />
      )}
    </label>
  );
}

const fieldLabel: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "#5a4a3a",
};

const input: React.CSSProperties = {
  border: "1px solid #ddd0bb",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 14,
  fontWeight: 400,
  color: "#2d2118",
};

const button: React.CSSProperties = {
  background: "#C2451E",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "12px 24px",
  fontSize: 14.5,
  fontWeight: 600,
  cursor: "pointer",
};

const linkBtn: React.CSSProperties = {
  border: "1px solid #ddd0bb",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 13.5,
  textDecoration: "none",
  color: "#2d2118",
};

const hint: React.CSSProperties = {
  fontSize: 13,
  color: "#8a7a68",
  lineHeight: 1.6,
  marginBottom: 12,
};
