import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ── Typography ────────────────────────────────────────────────
         Bebas Neue      → Headlines, page titles, section headers, stat values
         Barlow Condensed → Body copy, buttons, inputs, card titles
         DM Mono         → Timestamps, badges, metadata, technical readouts
         ────────────────────────────────────────────────────────────── */
      fontFamily: {
        display: ["'Bebas Neue'", "Impact", "sans-serif"],
        sans: [
          "var(--font-body)",
          "'Barlow Condensed'",
          "'Helvetica Neue'",
          "sans-serif",
        ],
        body: ["var(--font-body)", "'Barlow Condensed'", "sans-serif"],
        mono: ["var(--font-mono)", "'DM Mono'", "'Fira Code'", "monospace"],
        stat: ["'Bebas Neue'", "Impact", "sans-serif"],
      },

      /* ── Colors ────────────────────────────────────────────────────
         Surface depth order (never invert):
         bg-deep < bg-surface < bg-card < bg-card-high
         ────────────────────────────────────────────────────────────── */
      colors: {
        accent: {
          DEFAULT: "#FF1564",
          300: "#FF4D88",
          700: "#CC0E50",
        },
        gold: {
          DEFAULT: "#FFB800",
          300: "#FFD54F",
          700: "#CC9300",
        },
        cyan: {
          DEFAULT: "#00E5FF",
          300: "#4DE8FF",
          700: "#00B8CC",
        },
        green: {
          DEFAULT: "#00FF94",
          300: "#4FFFA8",
          700: "#00CC76",
        },
        purple: {
          DEFAULT: "#A855F7",
          300: "#C084FC",
          700: "#7C3AED",
        },
        red: {
          DEFAULT: "#FF3B30",
        },
        bg: {
          deep: "#03030A",
          surface: "#0A0A14",
          card: "#0F0F1E",
          "card-high": "#16162A",
        },
        text: {
          primary: "#F0F0FF",
          secondary: "#A0A0C0",
          muted: "#5A5A7A",
          dim: "#2E2E48",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.06)",
          hover: "rgba(255, 255, 255, 0.12)",
          active: "rgba(255, 21, 100, 0.4)",
        },
      },

      /* ── Font Sizes (Typography Scale) ─────────────────────────── */
      fontSize: {
        hero: ["52px", { lineHeight: "1.0", letterSpacing: "2px" }],
        "hero-sm": ["42px", { lineHeight: "1.05", letterSpacing: "2px" }],
        "page-title": ["22px", { lineHeight: "1.15", letterSpacing: "1.5px" }],
        "section-header": ["14px", { lineHeight: "1.2", letterSpacing: "1px" }],
        "section-header-sm": [
          "12px",
          { lineHeight: "1.2", letterSpacing: "0.8px" },
        ],
        "section-header-lg": [
          "16px",
          { lineHeight: "1.2", letterSpacing: "1px" },
        ],
        "card-title": ["14px", { lineHeight: "1.3", letterSpacing: "0.2px" }],
        "card-title-sm": [
          "12px",
          { lineHeight: "1.3", letterSpacing: "0.2px" },
        ],
        "card-title-lg": [
          "15px",
          { lineHeight: "1.3", letterSpacing: "0.2px" },
        ],
        "body-text": ["13px", { lineHeight: "1.5", letterSpacing: "0.2px" }],
        "body-sm": ["12px", { lineHeight: "1.5", letterSpacing: "0.1px" }],
        "body-lg": ["14px", { lineHeight: "1.5", letterSpacing: "0.3px" }],
        readout: ["10px", { lineHeight: "1.4", letterSpacing: "0.5px" }],
        "readout-sm": ["9px", { lineHeight: "1.4", letterSpacing: "0.5px" }],
        "readout-md": ["11px", { lineHeight: "1.4", letterSpacing: "0.5px" }],
      },

      /* ── Border Radius ─────────────────────────────────────────── */
      borderRadius: {
        card: "12px",
        panel: "16px",
        modal: "20px",
        button: "12px",
        input: "10px",
        badge: "6px",
      },

      /* ── Animations ────────────────────────────────────────────── */
      keyframes: {
        "live-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.3)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 21, 100, 0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 21, 100, 0.4)" },
        },
        "signal-pulse": {
          "0%, 100%": { opacity: "0.4", transform: "scaleY(0.7)" },
          "50%": { opacity: "1", transform: "scaleY(1)" },
        },
        "speaking-ring": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
        "chiron-scroll": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.92)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "live-pulse": "live-pulse 2s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "signal-pulse": "signal-pulse 1.4s ease-in-out infinite",
        "speaking-ring": "speaking-ring 1.2s ease-in-out infinite",
        "chiron-scroll": "chiron-scroll 30s linear infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.35s ease-out",
        "scale-in": "scale-in 0.25s ease-out",
      },

      /* ── Box Shadow ────────────────────────────────────────────── */
      boxShadow: {
        glow: "0 0 28px rgba(255, 21, 100, 0.35)",
        "glow-gold": "0 0 28px rgba(255, 184, 0, 0.3)",
        "glow-cyan": "0 0 28px rgba(0, 229, 255, 0.3)",
        "glow-green": "0 0 28px rgba(0, 255, 148, 0.3)",
        "glow-purple": "0 0 28px rgba(168, 85, 247, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
