"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBlankConfig, type BotConfig } from "@/lib/config";
import BusinessFields from "@/components/BusinessFields";
import BrandVoiceFields from "@/components/BrandVoiceFields";
import BrandingFields from "@/components/BrandingFields";
import HoursEditor from "@/components/HoursEditor";
import KnowledgeSectionsEditor from "@/components/KnowledgeSectionsEditor";
import FaqsEditor from "@/components/FaqsEditor";
import LeadCaptureEditor from "@/components/LeadCaptureEditor";
import { Section } from "@/components/FormKit";
import { button, secondaryButton, hint } from "@/components/formStyles";

const STEP_LABELS = ["Brand voice", "Train from website", "Bot & leads"];

export default function NewBotWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState<BotConfig>(() => getBlankConfig());

  const [trainUrl, setTrainUrl] = useState("");
  const [training, setTraining] = useState(false);
  const [trainError, setTrainError] = useState<string | null>(null);
  const [trainSummary, setTrainSummary] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function trainFromUrl() {
    if (!trainUrl.trim() || training) return;
    setTraining(true);
    setTrainError(null);
    setTrainSummary(null);
    try {
      const res = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trainUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTrainError(data.error || `Training failed (${res.status}).`);
        return;
      }
      setCfg((prev) => mergeDraft(prev, data.draft));
      const sectionCount = Array.isArray(data.draft?.knowledgeSections)
        ? data.draft.knowledgeSections.length
        : 0;
      const faqCount = Array.isArray(data.draft?.faqs) ? data.draft.faqs.length : 0;
      setTrainSummary(
        `Pulled in ${sectionCount} knowledge section${sectionCount === 1 ? "" : "s"} and ${faqCount} FAQ${
          faqCount === 1 ? "" : "s"
        } from that page. Anything already filled in was kept; review the Knowledge base tab in the editor after creating the bot.`
      );
    } catch {
      setTrainError("Network error — try again.");
    } finally {
      setTraining(false);
    }
  }

  async function create() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: cfg }),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = Array.isArray(data.errors) ? `\n• ${data.errors.join("\n• ")}` : "";
        setSaveError(`${data.error || "Create failed"}${details}`);
        setSaving(false);
        return;
      }
      router.push(`/dashboard/${data.bot.id}`);
    } catch {
      setSaveError("Network error — try again.");
      setSaving(false);
    }
  }

  const canLeaveStep0 = cfg.business.name.trim().length > 0;

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
      <Link href="/dashboard" style={{ fontSize: 13.5, color: "#767685" }}>
        ← Back to dashboard
      </Link>
      <h1 style={{ fontSize: 30, margin: "16px 0 8px" }}>New chatbot</h1>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "8px 4px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              background: i === step ? "#4F46E5" : i < step ? "#e7e5fb" : "#f4f3fa",
              color: i === step ? "#fff" : i < step ? "#4F46E5" : "#9a9aa8",
            }}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <>
          <Section title="Business basics">
            <BusinessFields
              value={cfg.business}
              onChange={(business) => setCfg((c) => ({ ...c, business }))}
            />
          </Section>
          <Section
            title="Brand voice"
            description="This shapes how the bot talks about the business — tone, framing, what it emphasizes. All optional, but the more you fill in, the more on-brand the bot sounds."
          >
            <BrandVoiceFields
              value={cfg.brandVoice}
              onChange={(brandVoice) => setCfg((c) => ({ ...c, brandVoice }))}
            />
          </Section>
        </>
      )}

      {step === 1 && (
        <Section
          title="Train from a website (optional)"
          description="Paste a link to the business's website — an About, Services, or Pricing page works best. The AI reads the page and drafts the bot's knowledge base for you to review and edit. Skip this and fill it in manually if you'd rather."
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <input
              value={trainUrl}
              onChange={(e) => setTrainUrl(e.target.value)}
              placeholder="https://example.com/about"
              style={{
                flex: 1,
                minWidth: 240,
                border: "1px solid #d9d9e3",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 14,
              }}
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
          {trainError && (
            <p style={{ color: "#b3261e", fontSize: 13.5, marginBottom: 12, whiteSpace: "pre-wrap" }}>
              {trainError}
            </p>
          )}
          {trainSummary && (
            <p style={{ color: "#2e5d24", fontSize: 13.5, marginBottom: 12 }}>{trainSummary}</p>
          )}

          {cfg.knowledgeSections.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Draft knowledge sections ({cfg.knowledgeSections.length})
              </p>
              <KnowledgeSectionsEditor
                value={cfg.knowledgeSections}
                onChange={(knowledgeSections) => setCfg((c) => ({ ...c, knowledgeSections }))}
              />
            </div>
          )}
          {cfg.faqs.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Draft FAQs ({cfg.faqs.length})
              </p>
              <FaqsEditor value={cfg.faqs} onChange={(faqs) => setCfg((c) => ({ ...c, faqs }))} />
            </div>
          )}
        </Section>
      )}

      {step === 2 && (
        <>
          <Section title="Hours">
            <HoursEditor value={cfg.hours} onChange={(hours) => setCfg((c) => ({ ...c, hours }))} />
          </Section>
          {cfg.knowledgeSections.length === 0 && (
            <Section
              title="Knowledge base"
              description="You skipped website training or it found nothing — add at least one section manually so the bot has something to say."
            >
              <KnowledgeSectionsEditor
                value={cfg.knowledgeSections}
                onChange={(knowledgeSections) => setCfg((c) => ({ ...c, knowledgeSections }))}
              />
            </Section>
          )}
          <Section title="FAQs">
            <FaqsEditor value={cfg.faqs} onChange={(faqs) => setCfg((c) => ({ ...c, faqs }))} />
          </Section>
          <Section title="Chat bubble branding">
            <BrandingFields
              value={cfg.branding}
              onChange={(branding) => setCfg((c) => ({ ...c, branding }))}
            />
          </Section>
          <Section
            title="Lead capture"
            description="What the bot collects when a visitor wants to be contacted."
          >
            <LeadCaptureEditor
              value={cfg.leadCapture}
              onChange={(leadCapture) => setCfg((c) => ({ ...c, leadCapture }))}
            />
          </Section>
        </>
      )}

      {saveError && (
        <p
          style={{
            whiteSpace: "pre-wrap",
            fontSize: 13.5,
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 16,
            background: "#fdeceb",
            color: "#b3261e",
          }}
        >
          {saveError}
        </p>
      )}

      <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{ ...secondaryButton, opacity: step === 0 ? 0.4 : 1 }}
        >
          Back
        </button>
        {step < 2 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(2, s + 1))}
            disabled={step === 0 && !canLeaveStep0}
            style={{ ...button, opacity: step === 0 && !canLeaveStep0 ? 0.6 : 1 }}
          >
            {step === 0 && !canLeaveStep0 ? "Enter a business name to continue" : "Next"}
          </button>
        ) : (
          <button type="button" onClick={create} disabled={saving} style={{ ...button, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Creating…" : "Create chatbot"}
          </button>
        )}
      </div>
      <p style={{ ...hint, marginTop: 16 }}>
        Everything here can be changed later in the bot editor — nothing is locked in.
      </p>
    </main>
  );
}

/** Merges a website-training draft into the wizard's config: fills blanks, never overwrites typed text. */
function mergeDraft(prev: BotConfig, draft: any): BotConfig {
  if (!draft || typeof draft !== "object") return prev;

  const business = { ...prev.business };
  if (draft.business && typeof draft.business === "object") {
    for (const k of ["name", "tagline", "phone", "email"] as const) {
      const v = draft.business[k];
      if (typeof v === "string" && v.trim() && !business[k].trim()) business[k] = v;
    }
    if (draft.business.address && typeof draft.business.address === "object") {
      const addr = { ...business.address };
      for (const k of ["street", "city", "state", "zip"] as const) {
        const v = draft.business.address[k];
        if (typeof v === "string" && v.trim() && !addr[k].trim()) addr[k] = v;
      }
      business.address = addr;
    }
  }

  const brandVoice = { ...prev.brandVoice };
  if (draft.brandVoice && typeof draft.brandVoice === "object") {
    for (const k of ["whatYouDo", "targetAudience", "differentiators"] as const) {
      const v = draft.brandVoice[k];
      if (typeof v === "string" && v.trim() && !brandVoice[k].trim()) brandVoice[k] = v;
    }
  }

  const hasHours =
    draft.hours &&
    typeof draft.hours === "object" &&
    ((draft.hours.schedule && Object.keys(draft.hours.schedule).length > 0) ||
      (typeof draft.hours.notes === "string" && draft.hours.notes.trim()));

  return {
    ...prev,
    business,
    brandVoice,
    hours: hasHours ? { schedule: draft.hours.schedule || {}, notes: draft.hours.notes || "" } : prev.hours,
    knowledgeSections: Array.isArray(draft.knowledgeSections) && draft.knowledgeSections.length
      ? draft.knowledgeSections.filter((s: any) => s && s.title && s.content)
      : prev.knowledgeSections,
    faqs: Array.isArray(draft.faqs) && draft.faqs.length
      ? draft.faqs.filter((f: any) => f && f.q && f.a)
      : prev.faqs,
  };
}
