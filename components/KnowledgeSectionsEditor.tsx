"use client";

import type { KnowledgeSection } from "@/lib/config";
import { input, secondaryButton } from "./formStyles";

export default function KnowledgeSectionsEditor({
  value,
  onChange,
}: {
  value: KnowledgeSection[];
  onChange: (v: KnowledgeSection[]) => void;
}) {
  function update(i: number, patch: Partial<KnowledgeSection>) {
    const next = value.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...value, { title: "", content: "" }]);
  }

  return (
    <>
      <p style={{ fontSize: 13, color: "#767685", marginBottom: 14 }}>
        Anything the bot should know — services & pricing, process, policies, product details.
        Give each topic its own section. Anything not covered here, the bot will decline to answer
        and offer contact info instead of guessing.
      </p>
      <div style={{ display: "grid", gap: 14, marginBottom: 14 }}>
        {value.map((section, i) => (
          <div
            key={i}
            style={{ border: "1px solid #ece9f5", borderRadius: 10, padding: 14, display: "grid", gap: 8 }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={section.title}
                onChange={(e) => update(i, { title: e.target.value })}
                placeholder="Section title, e.g. Services & Pricing"
                style={{ ...input, fontWeight: 600 }}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove section"
                style={{ ...secondaryButton, padding: "8px 12px", flexShrink: 0 }}
              >
                Remove
              </button>
            </div>
            <textarea
              value={section.content}
              onChange={(e) => update(i, { content: e.target.value })}
              placeholder="Details the bot should know about this topic…"
              rows={4}
              style={{ ...input, resize: "vertical", fontFamily: "inherit" }}
            />
          </div>
        ))}
      </div>
      <button type="button" onClick={add} style={secondaryButton}>
        + Add section
      </button>
    </>
  );
}
