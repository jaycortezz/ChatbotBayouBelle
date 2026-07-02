import type { CSSProperties } from "react";

export const fieldLabel: CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "#4b4b57",
};

export const input: CSSProperties = {
  border: "1px solid #d9d9e3",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 14,
  fontWeight: 400,
  color: "#1c1c24",
  width: "100%",
};

export const button: CSSProperties = {
  background: "#4F46E5",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "12px 24px",
  fontSize: 14.5,
  fontWeight: 600,
  cursor: "pointer",
};

export const secondaryButton: CSSProperties = {
  ...button,
  background: "transparent",
  color: "#1c1c24",
  border: "1px solid #d9d9e3",
};

export const linkBtn: CSSProperties = {
  border: "1px solid #d9d9e3",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 13.5,
  textDecoration: "none",
  color: "#1c1c24",
};

export const hint: CSSProperties = {
  fontSize: 13,
  color: "#767685",
  lineHeight: 1.6,
  marginBottom: 12,
};

export const accent = "#4F46E5";
