// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Landing Page (Root)
//
// Public-facing hero, feature highlights, tier pricing, and CTA
// Redirects to /dashboard if already authenticated
//
// TYPOGRAPHY:
//   Bebas Neue       → hero headline, section headers, stat values
//   Barlow Condensed → body, feature descriptions, buttons
//   DM Mono          → pricing values, stat labels, badges
// ──────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { BrandGradientLine } from "@/components/brand/BrandGradientLine";
import { ChironBar } from "@/components/brand/ChironBar";

const features = [
  {
    emoji: "📺",
    title: "Multi-Panel Streams",
    desc: "Up to 9 camera panels with real-time director control. Multi-destination RTMP streaming to any platform.",
  },
  {
    emoji: "🎙️",
    title: "Audio Rooms",
    desc: "Drop-in voice rooms with speaking indicators, hand raise, and audience management for live discussions.",
  },
  {
    emoji: "🤖",
    title: "Aura AI Co‑Host",
    desc: "GPT-4 powered personality that reads chat, reacts to tips, and engages viewers automatically in 4 modes.",
  },
  {
    emoji: "💰",
    title: "Instant Monetization",
    desc: "Stripe-powered paywalls, tips, subscriptions, and an NFT marketplace for highlight moments.",
  },
  {
    emoji: "🌍",
    title: "Real‑Time Translation",
    desc: "Automatic chat translation across 40+ languages, powered by language detection and AI translation.",
  },
  {
    emoji: "📊",
    title: "Creator Analytics",
    desc: "Live viewer analytics, revenue tracking, audience insights, and AI-powered growth recommendations.",
  },
];

const tiers = [
  {
    name: "FREE",
    price: "$0",
    period: "/forever",
    color: "var(--text-muted)",
    features: [
      "1 panel stream",
      "720p quality",
      "Basic chat",
      "Community access",
    ],
  },
  {
    name: "CREATOR",
    price: "$9",
    period: "/month",
    color: "var(--cyan)",
    features: [
      "3 panel stream",
      "1080p quality",
      "Custom overlays",
      "Paywall access",
      "Priority support",
    ],
  },
  {
    name: "PRO",
    price: "$29",
    period: "/month",
    color: "var(--gold)",
    badge: "POPULAR",
    features: [
      "6 panel stream",
      "4K quality",
      "Aura AI Co-Host",
      "Full analytics",
      "NFT minting",
      "Multi-destination",
    ],
  },
  {
    name: "STUDIO",
    price: "$79",
    period: "/month",
    color: "var(--accent)",
    features: [
      "9 panel stream",
      "4K HDR quality",
      "Aura AI unlimited",
      "White-label branding",
      "API access",
      "Dedicated support",
      "Custom RTMP",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-deep)" }}>
      <BrandGradientLine />

      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <header className="relative overflow-hidden">
        {/* Glow backdrop */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, var(--accent), transparent 70%)",
          }}
        />

        <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <span className="text-white font-bold text-sm">CY</span>
            </div>
            <span className="font-display text-2xl tracking-wider text-white">
              CYLIVE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-body-sm text-white/70 hover:text-white transition-colors px-4 py-2"
            >
              Skip
            </Link>
            <Link href="/dashboard" className="btn-primary text-sm px-6 py-2.5">
              Enter Platform
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "var(--green)" }}
            />
            <span
              className="text-readout-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Live platform — 2,847 creators streaming now
            </span>
          </div>

          <h1
            className="font-display text-white leading-none"
            style={{
              fontSize: "clamp(48px, 8vw, 96px)",
              letterSpacing: "0.04em",
            }}
          >
            STREAM BEYOND
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), var(--gold), var(--cyan))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              BOUNDARIES
            </span>
          </h1>

          <p
            className="text-body text-white/60 max-w-2xl mx-auto mt-6"
            style={{ fontSize: "18px" }}
          >
            The next-generation creator platform with multi-panel streaming, AI
            co-host, real-time translation, and instant monetization — all in
            one place.
          </p>

          <div className="flex items-center justify-center gap-4 mt-10">
            <Link
              href="/dashboard"
              className="btn-primary text-base px-8 py-3.5 flex items-center gap-2"
            >
              Launch Dashboard →
            </Link>
            <Link href="#features" className="btn-ghost text-base px-8 py-3.5">
              See Features
            </Link>
          </div>

          {/* Hero stats */}
          <div className="flex items-center justify-center gap-10 mt-16">
            {[
              { value: "50K+", label: "CREATORS" },
              { value: "2.1M", label: "VIEWERS" },
              { value: "$4.8M", label: "EARNED" },
            ].map((s) => (
              <div key={s.label}>
                <p
                  className="font-stat text-white"
                  style={{ fontSize: "32px" }}
                >
                  {s.value}
                </p>
                <p
                  className="text-readout-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2
            className="font-display text-white"
            style={{ fontSize: "40px", letterSpacing: "0.04em" }}
          >
            EVERYTHING CREATORS NEED
          </h2>
          <p
            className="text-body mt-3"
            style={{ color: "var(--text-muted)", fontSize: "16px" }}
          >
            Professional broadcasting tools, AI-powered engagement, and seamless
            monetization
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass-panel p-7 group hover:border-[var(--accent)]/30 transition-all"
            >
              <div className="text-3xl mb-4">{f.emoji}</div>
              <h3 className="text-card-title-lg text-white group-hover:text-[var(--accent)] transition-colors">
                {f.title}
              </h3>
              <p
                className="text-body-sm mt-2"
                style={{ color: "var(--text-muted)" }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2
            className="font-display text-white"
            style={{ fontSize: "40px", letterSpacing: "0.04em" }}
          >
            CHOOSE YOUR TIER
          </h2>
          <p
            className="text-body mt-3"
            style={{ color: "var(--text-muted)", fontSize: "16px" }}
          >
            Start free, upgrade when you outgrow it
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {tiers.map((t) => (
            <div
              key={t.name}
              className="glass-panel p-6 relative group hover:border-[color:var(--accent)]/20 transition-all"
              style={t.badge ? { border: `1px solid ${t.color}33` } : undefined}
            >
              {t.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-readout-sm"
                  style={{ background: t.color, color: "#000" }}
                >
                  {t.badge}
                </div>
              )}
              <p
                className="text-readout-sm font-bold"
                style={{ color: t.color, letterSpacing: "0.12em" }}
              >
                {t.name}
              </p>
              <div className="flex items-baseline gap-1 mt-3">
                <span
                  className="font-stat text-white"
                  style={{ fontSize: "40px" }}
                >
                  {t.price}
                </span>
                <span
                  className="text-readout-sm"
                  style={{ color: "var(--text-dim)" }}
                >
                  {t.period}
                </span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {t.features.map((feat) => (
                  <li
                    key={feat}
                    className="text-body-sm flex items-center gap-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span style={{ color: t.color }}>✓</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="btn-ghost w-full mt-6 text-center block"
                style={
                  t.badge
                    ? {
                        background: `${t.color}20`,
                        borderColor: `${t.color}40`,
                        color: t.color,
                      }
                    : undefined
                }
              >
                Launch Studio
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Footer ────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2
          className="font-display text-white"
          style={{ fontSize: "36px", letterSpacing: "0.04em" }}
        >
          READY TO GO LIVE?
        </h2>
        <p
          className="text-body mt-3 max-w-xl mx-auto"
          style={{ color: "var(--text-muted)" }}
        >
          Join thousands of creators who have already made the switch. No credit
          card required.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary text-base px-10 py-4 mt-8 inline-flex items-center gap-2"
        >
          Enter Your Command Center →
        </Link>
      </section>

      <ChironBar />
    </div>
  );
}
