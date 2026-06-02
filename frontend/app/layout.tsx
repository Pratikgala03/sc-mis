import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SC MIS — SureCare Chelsea & Fulham",
  description: "Management Information System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
