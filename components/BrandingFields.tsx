"use client";

import type { Branding } from "@/lib/config";
import { Field, Grid } from "./FormKit";

export default function BrandingFields({
  value,
  onChange,
}: {
  value: Branding;
  onChange: (v: Branding) => void;
}) {
  const set = <K extends keyof Branding>(k: K, v: Branding[K]) => onChange({ ...value, [k]: v });

  return (
    <>
      <Grid>
        <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 600, color: "#4b4b57" }}>
          Accent color
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(value.accentColor) ? value.accentColor : "#4F46E5"}
              onChange={(e) => set("accentColor", e.target.value)}
              style={{ width: 48, height: 38, border: "1px solid #d9d9e3", borderRadius: 6, padding: 2 }}
            />
            <input
              value={value.accentColor}
              onChange={(e) => set("accentColor", e.target.value)}
              style={{
                border: "1px solid #d9d9e3",
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: 14,
                width: 110,
              }}
            />
          </div>
        </label>
        <Field label="Bot name (persona)" value={value.botName} onChange={(v) => set("botName", v)} />
        <Field
          label="Bubble label (hover text)"
          value={value.bubbleLabel}
          onChange={(v) => set("bubbleLabel", v)}
        />
      </Grid>
      <Field
        label="Greeting (first message)"
        value={value.greeting}
        onChange={(v) => set("greeting", v)}
        textarea
      />
    </>
  );
}
