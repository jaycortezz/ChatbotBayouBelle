import type { Metadata } from "next";
import { getConfig } from "@/lib/config";
import "./globals.css";

const cfg = getConfig();

export const metadata: Metadata = {
  title: `${cfg.business.name} — ${cfg.business.tagline}`,
  description: `Website chat assistant for ${cfg.business.name}`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
