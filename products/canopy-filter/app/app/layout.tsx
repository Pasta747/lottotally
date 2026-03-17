import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canopy Filter — Engage with your community on your terms",
  description:
    "Canopy Filter helps female podcasters and YouTubers filter the noise from their comment sections so they can engage fully with the community they actually built.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
