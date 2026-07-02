import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cortez Chatbots",
  description: "Create and manage AI chat widgets for any client business.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
