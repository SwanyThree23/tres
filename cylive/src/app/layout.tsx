// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Root Layout
// Font loading, providers, metadata
// ──────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { Outfit, DM_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "@/components/providers/Providers";
import "@/styles/globals.css";

// ── Font Configuration ──────────────────────────────────────────────────────

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Bebas Neue via Google Fonts CDN (loaded in globals.css @import)
// We set the CSS variable manually since next/font doesn't support all weights

// ── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "CYLive — Culture Creator Live Streaming",
    template: "%s | CYLive",
  },
  description:
    "CYLive is the live streaming platform for culture creators. Multi-panel streaming, 90% direct payouts, AI co-host, and real-time audience engagement.",
  keywords: [
    "live streaming",
    "creator platform",
    "multi-panel streaming",
    "direct payments",
    "AI co-host",
    "culture creators",
    "talk shows",
    "music streaming",
    "community",
  ],
  openGraph: {
    title: "CYLive — Culture Creator Live Streaming",
    description:
      "Stream in multi-panel formats. Earn 90% of all payments. Engage audiences with AI-powered tools.",
    type: "website",
    siteName: "CYLive",
  },
  twitter: {
    card: "summary_large_image",
    title: "CYLive — Culture Creator Live Streaming",
    description:
      "Stream in multi-panel formats. Earn 90% of all payments. Engage audiences with AI-powered tools.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
      className={`${outfit.variable} ${dmMono.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#03030A" />
        <link rel="icon" href="/favicon.ico" />
        {/* Bebas Neue loaded via CSS @import in globals.css */}
      </head>
      <body className="bg-bg-deep text-text-primary font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
