"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Bot } from "@/lib/store";
import type { BotConfig } from "@/lib/config";
import { Section } from "@/components/FormKit";
import BusinessFields from "@/components/BusinessFields";
import BrandVoiceFields from "@/components/BrandVoiceFields";
import BrandingFields from "@/components/BrandingFields";
import HoursEditor from "@/components/HoursEditor";
import KnowledgeSectionsEditor from "@/components/KnowledgeSectionsEditor";
import FaqsEditor from "@/components/FaqsEditor";
import LeadCaptureEditor from "@/components/LeadCaptureEditor";
import BotSettingsFields from "@/components/BotSettingsFields";
import TestChatPanel from "@/components/TestChatPanel";
import { button, linkBtn, hint, input } from "@/components/formStyles";

export default function BotEditor({ initialBot, origin }: { initialBot: Bot; origin: string }) {
  const router = useRouter();
  const [cfg, setCfg] = useState<BotConfig>(initialBot.config);
  const [emailTo, setEmailTo] = useState(initialBot.notifications.emailTo || "");
  const [webhookUrl, setWebhookUrl] = useState(initialBot.notifications.webhookUrl || "");
  const [trainUrl, setTrainUrl] = useState("");
  const [training, setTraining] = useState(false);
  const [trainMsg, setTrainMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const embedSnippet = useMemo(
    () => `<script src="${origin}/widget.js" data-bot="${initialBot.id}" async></script>`,
    [origin, initialBot.id]
  );

  function set<K extends keyof BotConfig>(key: K, value: BotConfig[K]) {
    setCfg((c) => ({ ...c, [key]: value }));
  }

  async function trainFromUrl() {
    if (!trainUrl.trim() || training) return;
    setTraining(true);
    setTrainMsg(null);
    try {
      const res = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trainUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTrainMsg({ kind: "error", text: data.error || `Training failed (${res.status}).` });
        return;
      }
      const draft = data.draft || {};
      if (Array.isArray(draft.knowledgeSections) && draft.knowledgeSections.length) {
        set("knowledgeSections", [
          ...cfg.knowledgeSections,
          ...draft.knowledgeSections.filter((s: any) => s?.title && s?.content),
        ]);
      }
      if (Array.isArray(draft.faqs) && draft.faqs.length) {
        set("faqs", [...cfg.faqs, ...draft.faqs.filter((f: any) => f?.q && f?.a)]);
      }
      setTrainMsg({
        kind: "ok",
        text: `Added ${draft.knowledgeSections?.length || 0} section(s) and ${
          draft.faqs?.length || 0
        } FAQ(s) below — review and edit, then save.`,
      });
    } catch {
      setTrainMsg({ kind: "error", text: "Network error — try again." });
    } finally {
      setTraining(false);
    }
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/bots/${initialBot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: cfg, notifications: { emailTo, webhookUrl } }),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = Array.isArray(data.errors) ? `\n• ${data.errors.join("\n• ")}` : "";
        setStatus({ kind: "error", text: `${data.error || "Save failed"}${details}` });
      } else {
        setStatus({ kind: "ok", text: "Saved. The test panel and live widget now use this version." });
        router.refresh();
      }
    } catch {
      setStatus({ kind: "error", text: "Network error — try again." });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${cfg.business.name}" and all its leads/conversations? This can't be undone.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/bots/${initialBot.id}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard");
      else {
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
      // clipboard unavailable; snippet is still selectable text
    }
  }

  return (
    <main style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 24px 80px" }}>
      <Link href="/dashboard" style={{ fontSize: 13.5, color: "#767685" }}>
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
        <h1 style={{ fontSize: 30 }}>{cfg.business.name || "Chatbot"}</h1>
        <Link href={`/dashboard/${initialBot.id}/leads`} style={linkBtn}>
          Leads
        </Link>
      </div>
      <p style={{ color: "#9a9aa8", fontSize: 12.5, marginBottom: 28 }}>{initialBot.id}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
        <div>
          <Section title="Embed on the client's website">
            <p style={hint}>Paste this one line before &lt;/body&gt; on any site:</p>
            <div style={{ display: "flex", gap: 8, alignItems: "stretch", flexWrap: "wrap" }}>
              <code
                style={{
                  flex: 1,
                  minWidth: 260,
                  background: "#1c1c24",
                  color: "#e9e7fb",
                  padding: "12px 14px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                }}
              >
                {embedSnippet}
              </code>
              <button onClick={copySnippet} style={{ ...button, background: "#1c1c24" }}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </Section>

          <Section title="Business basics">
            <BusinessFields value={cfg.business} onChange={(business) => set("business", business)} />
          </Section>

          <Section
            title="Brand voice"
            description="Shapes how the bot talks about the business — tone, framing, what it emphasizes."
          >
            <BrandVoiceFields value={cfg.brandVoice} onChange={(brandVoice) => set("brandVoice", brandVoice)} />
          </Section>

          <Section
            title="Train from a website"
            description="Paste a link and the AI will draft knowledge sections and FAQs, added to what's below (existing content is kept)."
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <input
                value={trainUrl}
                onChange={(e) => setTrainUrl(e.target.value)}
                placeholder="https://example.com/services"
                style={{ ...input, flex: 1, minWidth: 220 }}
              />
              <button
                type="button"
                onClick={trainFromUrl}
                disabled={training || !trainUrl.trim()}
                style={{ ...button, opacity: training || !trainUrl.trim() ? 0.6 : 1 }}
              >
                {training ? "Reading page…" : "Train from this page"}
              </button>
            </div>
            {trainMsg && (
              <p style={{ fontSize: 13.5, color: trainMsg.kind === "ok" ? "#2e5d24" : "#b3261e" }}>
                {trainMsg.text}
              </p>
            )}
          </Section>

          <Section title="Hours">
            <HoursEditor value={cfg.hours} onChange={(hours) => set("hours", hours)} />
          </Section>

          <Section title="Knowledge base">
            <KnowledgeSectionsEditor
              value={cfg.knowledgeSections}
              onChange={(knowledgeSections) => set("knowledgeSections", knowledgeSections)}
            />
          </Section>

          <Section title="FAQs">
            <FaqsEditor value={cfg.faqs} onChange={(faqs) => set("faqs", faqs)} />
          </Section>

          <Section title="Chat bubble branding">
            <BrandingFields value={cfg.branding} onChange={(branding) => set("branding", branding)} />
          </Section>

          <Section title="Lead capture">
            <LeadCaptureEditor value={cfg.leadCapture} onChange={(leadCapture) => set("leadCapture", leadCapture)} />
          </Section>

          <Section
            title="Lead notifications"
            description="Where to send new leads for this bot. Leave blank to fall back to the platform-wide defaults (env vars). Email requires RESEND_API_KEY to be set on the deployment."
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 600, color: "#4b4b57" }}>
                Notification email
                <input
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="owner@business.com"
                  style={input}
                />
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 600, color: "#4b4b57" }}>
                Webhook URL
                <input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/..."
                  style={input}
                />
              </label>
            </div>
          </Section>

          <Section title="Bot settings">
            <BotSettingsFields value={cfg.bot} onChange={(bot) => set("bot", bot)} />
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

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={save} disabled={busy} style={{ ...button, opacity: busy ? 0.6 : 1 }}>
              {busy ? "Working…" : "Save changes"}
            </button>
            <button
              onClick={remove}
              disabled={busy}
              style={{ ...button, background: "transparent", color: "#b3261e", border: "1px solid #f0c4c0" }}
            >
              Delete bot
            </button>
          </div>
        </div>

        <div style={{ position: "sticky", top: 24 }}>
          <TestChatPanel
            botId={initialBot.id}
            botName={cfg.branding.botName}
            accentColor={cfg.branding.accentColor}
            greeting={cfg.branding.greeting}
          />
          <p style={{ ...hint, marginTop: 10 }}>Testing uses the last saved version — save your edits first.</p>
        </div>
      </div>
    </main>
  );
}
