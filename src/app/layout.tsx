import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IssueLens",
  description: "Evidence-based triage for approved public GitHub issues.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
