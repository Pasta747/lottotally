import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const gaId = process.env.NEXT_PUBLIC_GA_ID;
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

export const metadata: Metadata = {
  title: {
    default: "LottoTally — Lottery Reconciliation for Independent Retailers",
    template: "%s | LottoTally",
  },
  description: "Auto-reconcile scratch-off and terminal lottery sales. Catch discrepancies before they become losses. Built for independent lottery retailers.",
  openGraph: {
    title: "LottoTally — Stop Lottery Shrink",
    description: "Auto-reconcile scratch-off and terminal lottery sales. Catch discrepancies before they become losses.",
    url: "https://lottotally.com",
    siteName: "LottoTally",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LottoTally — Stop Lottery Shrink",
    description: "Auto-reconcile scratch-off and terminal lottery sales. Catch discrepancies before they become losses.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        {googleAdsId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`} strategy="afterInteractive" />
            <Script id="google-ads" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAdsId}');
              `}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
