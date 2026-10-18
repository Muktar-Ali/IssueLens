import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IssueLens",
  description: "Evidence-based GitHub issue triage and code investigation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
