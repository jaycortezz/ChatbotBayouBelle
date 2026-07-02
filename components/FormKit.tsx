"use client";

import { fieldLabel, input } from "./formStyles";

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid #ece9f5",
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 20,
        background: "#fff",
      }}
    >
      <h2 style={{ fontSize: 16, marginBottom: description ? 4 : 14, color: "#4F46E5" }}>
        {title}
      </h2>
      {description && (
        <p style={{ fontSize: 13, color: "#767685", marginBottom: 14, lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      {children}
    </section>
  );
}

export function Grid({ children }: { children: React.ReactNode }) {
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

export function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label style={fieldLabel}>
      {label}
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
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
