import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LottoTally",
  description: "Lottery reconciliation software for independent stores",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
