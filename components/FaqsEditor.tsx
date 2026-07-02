"use client";

import type { Faq } from "@/lib/config";
import { input, secondaryButton } from "./formStyles";

export default function FaqsEditor({
  value,
  onChange,
}: {
  value: Faq[];
  onChange: (v: Faq[]) => void;
}) {
  function update(i: number, patch: Partial<Faq>) {
    const next = value.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...value, { q: "", a: "" }]);
  }

  return (
    <>
      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        {value.map((faq, i) => (
          <div
            key={i}
            style={{ border: "1px solid #ece9f5", borderRadius: 10, padding: 14, display: "grid", gap: 8 }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={faq.q}
                onChange={(e) => update(i, { q: e.target.value })}
                placeholder="Question"
                style={{ ...input, fontWeight: 600 }}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove FAQ"
                style={{ ...secondaryButton, padding: "8px 12px", flexShrink: 0 }}
              >
                Remove
              </button>
            </div>
            <textarea
              value={faq.a}
              onChange={(e) => update(i, { a: e.target.value })}
              placeholder="Answer"
              rows={2}
              style={{ ...input, resize: "vertical", fontFamily: "inherit" }}
            />
          </div>
        ))}
      </div>
      <button type="button" onClick={add} style={secondaryButton}>
        + Add FAQ
      </button>
    </>
  );
}
