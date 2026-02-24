import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── CYLive Design Token Palette ───────────────────────────────────
      colors: {
        accent: {
          DEFAULT: "#FF1564",
          50: "#FFF0F4",
          100: "#FFE0EA",
          200: "#FFC0D4",
          300: "#FF85AA",
          400: "#FF4D82",
          500: "#FF1564",
          600: "#E0004E",
          700: "#B3003E",
          800: "#80002D",
          900: "#4D001B",
        },
        gold: {
          DEFAULT: "#FFB800",
          50: "#FFF8E5",
          100: "#FFF0C2",
          200: "#FFE085",
          300: "#FFD14A",
          400: "#FFC31A",
          500: "#FFB800",
          600: "#CC9300",
          700: "#996E00",
          800: "#664A00",
          900: "#332500",
        },
        cyan: {
          DEFAULT: "#00F5FF",
          50: "#E5FEFF",
          100: "#C2FDFF",
          200: "#85FBFF",
          300: "#4DF9FF",
          400: "#1AF7FF",
          500: "#00F5FF",
          600: "#00C4CC",
          700: "#009399",
          800: "#006266",
          900: "#003133",
        },
        // Background layers
        bg: {
          DEFAULT: "#03030A",
          deep: "#03030A",
          surface: "#07070F",
          card: "#0B0B18",
          "card-high": "#11111E",
        },
        border: {
          DEFAULT: "#16162A",
          dim: "#0E0E1E",
        },
        text: {
          DEFAULT: "#F0F0FF",
          primary: "#F0F0FF",
          muted: "#5A5A7A",
          dim: "#2A2A48",
        },
        green: {
          DEFAULT: "#00FF88",
          live: "#00FF88",
        },
        purple: {
          DEFAULT: "#8B5CF6",
          aura: "#8B5CF6",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
        stat: ["var(--font-bebas)", "cursive"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out both",
        "slide-up": "slideUp 0.4s ease-out both",
        "slide-right": "slideRight 0.35s ease-out both",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "live-pulse": "livePulse 1.8s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 16px rgba(255, 21, 100, 0.25)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 21, 100, 0.55)" },
        },
        livePulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.15)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
      backdropBlur: {
        xs: "2px",
        glass: "16px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(255, 21, 100, 0.3)",
        "glow-gold": "0 0 20px rgba(255, 184, 0, 0.3)",
        "glow-cyan": "0 0 20px rgba(0, 245, 255, 0.3)",
        "glow-green": "0 0 20px rgba(0, 255, 136, 0.3)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
