// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Root Layout
// 
// TYPOGRAPHY:
//   Barlow Condensed → body, buttons, inputs, descriptions
//   Bebas Neue       → headlines, page titles, section headers, stat values
//   DM Mono          → timestamps, badges, metadata, technical readouts
//
// BRAND SIGNATURES (permanent — never remove):
//   1. BrandGradientLine — 2px gradient at top of every page
//   2. ChironBar — 34px fixed bar at bottom of viewport
// ──────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { Barlow_Condensed, DM_Mono } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { BrandGradientLine } from "@/components/brand/BrandGradientLine";
import { ChironBar } from "@/components/brand/ChironBar";
import "@/styles/globals.css";

// ── Font Configuration ──────────────────────────────────────────────────────
// Bebas Neue is loaded via @import in globals.css (Google Fonts CDN)
// because next/font doesn't support its single-weight format optimally

const barlowCondensed = Barlow_Condensed({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// ── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "SEEWHY LIVE — Culture Creator Live Streaming",
    template: "%s | SEEWHY LIVE",
  },
  description:
    "SEEWHY LIVE is the live streaming platform for culture creators. Multi-panel streaming, 90% direct payouts, AI co-host, and real-time audience engagement.",
  keywords: [
    "live streaming",
    "creator platform",
    "multi-panel streaming",
    "direct payments",
    "AI co-host",
    "culture creators",
  ],
  openGraph: {
    title: "SEEWHY LIVE — Culture Creator Live Streaming",
    description:
      "Stream in multi-panel formats. Earn 90% of all payments. Engage audiences with AI-powered tools.",
    url: "https://seewhylive.com",
    siteName: "SEEWHY LIVE",
    images: ["/og-image.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "SEEWHY LIVE — Culture Creator Live Streaming",
    description:
      "Stream in multi-panel formats. Earn 90% of all payments.",
  },
  robots: { index: true, follow: true },
};

// ── Root Layout ─────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#03030A" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <Providers>
          {/* ═══════════════════════════════════════════════════════════════
              BRAND SIGNATURE #1 — Gradient Line (top of every page)
              PERMANENT — never remove, hide, or conditionally render
              ═══════════════════════════════════════════════════════════════ */}
          <BrandGradientLine />

          {/* Main content */}
          {children}

          {/* ═══════════════════════════════════════════════════════════════
              BRAND SIGNATURE #2 — Chiron Bar (bottom of viewport)
              PERMANENT — never remove, hide, or conditionally render
              ═══════════════════════════════════════════════════════════════ */}
          <ChironBar />
        </Providers>
      </body>
    </html>
  );
}
