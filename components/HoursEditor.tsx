"use client";

import { WEEKDAYS, type Hours } from "@/lib/config";
import { input } from "./formStyles";

export default function HoursEditor({
  value,
  onChange,
}: {
  value: Hours;
  onChange: (v: Hours) => void;
}) {
  function setDay(day: string, hoursText: string) {
    onChange({ ...value, schedule: { ...value.schedule, [day]: hoursText } });
  }

  return (
    <>
      <p style={{ fontSize: 13, color: "#767685", marginBottom: 10 }}>
        Leave a day blank if it doesn&apos;t apply — e.g. online-only businesses can skip this
        entirely.
      </p>
      <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        {WEEKDAYS.map((day) => (
          <div key={day} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 13.5, color: "#4b4b57" }}>{day}</span>
            <input
              value={value.schedule[day] || ""}
              onChange={(e) => setDay(day, e.target.value)}
              placeholder="e.g. 9:00 AM – 5:00 PM, or Closed"
              style={input}
            />
          </div>
        ))}
      </div>
      <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 600, color: "#4b4b57" }}>
        Notes (holidays, seasonal changes, etc.)
        <textarea
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          rows={2}
          style={{ ...input, resize: "vertical", fontFamily: "inherit" }}
        />
      </label>
    </>
  );
}
