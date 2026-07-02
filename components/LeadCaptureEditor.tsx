"use client";

import type { LeadCapture, LeadField } from "@/lib/config";
import { input, secondaryButton } from "./formStyles";

function slugify(label: string): string {
  const s = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return /^[a-z_]/.test(s) ? s : `f_${s}`;
}

export default function LeadCaptureEditor({
  value,
  onChange,
}: {
  value: LeadCapture;
  onChange: (v: LeadCapture) => void;
}) {
  function updateField(i: number, patch: Partial<LeadField>) {
    const next = value.fields.slice();
    next[i] = { ...next[i], ...patch };
    onChange({ ...value, fields: next });
  }
  function removeField(i: number) {
    onChange({ ...value, fields: value.fields.filter((_, idx) => idx !== i) });
  }
  function addField() {
    onChange({ ...value, fields: [...value.fields, { key: "", label: "", required: false }] });
  }

  return (
    <>
      <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          style={{ width: 18, height: 18 }}
        />
        Capture leads from conversations
      </label>

      {value.enabled && (
        <>
          <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 600, color: "#4b4b57", marginBottom: 16 }}>
            When should the bot try to capture a lead?
            <textarea
              value={value.triggerDescription}
              onChange={(e) => onChange({ ...value, triggerDescription: e.target.value })}
              placeholder="e.g. when a visitor wants a quote, wants to book a service, or asks to be contacted"
              rows={2}
              style={{ ...input, resize: "vertical", fontFamily: "inherit" }}
            />
          </label>

          <p style={{ fontSize: 13, fontWeight: 600, color: "#4b4b57", marginBottom: 8 }}>
            Details to collect
          </p>
          <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            {value.fields.map((f, i) => (
              <div
                key={i}
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8, alignItems: "center" }}
              >
                <input
                  value={f.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    updateField(i, { label, key: f.key || slugify(label) });
                  }}
                  placeholder="Label shown in leads (e.g. Phone)"
                  style={input}
                />
                <input
                  value={f.key}
                  onChange={(e) => updateField(i, { key: e.target.value })}
                  placeholder="field_key"
                  title="Internal key — letters, numbers, underscores only"
                  style={{ ...input, fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, whiteSpace: "nowrap" }}>
                  <input
                    type="checkbox"
                    checked={f.required}
                    onChange={(e) => updateField(i, { required: e.target.checked })}
                  />
                  Required
                </label>
                <button
                  type="button"
                  onClick={() => removeField(i)}
                  aria-label="Remove field"
                  style={{ ...secondaryButton, padding: "6px 10px", fontSize: 12.5 }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addField} style={secondaryButton}>
            + Add field
          </button>
        </>
      )}
    </>
  );
}
