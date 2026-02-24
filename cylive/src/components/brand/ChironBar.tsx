// ──────────────────────────────────────────────────────────────────────────────
// CYLive — ChironBar Component
// BRAND SIGNATURE #2 — 34px fixed bar pinned to viewport bottom
// PERMANENT — never remove, hide, or conditionally render
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";

interface ChironBarProps {
  /** Optional custom ticker text override */
  tickerText?: string;
}

export function ChironBar({ tickerText }: ChironBarProps) {
  const defaultTicker =
    "CYLive — Multi-Panel Creator Streaming • 90% Direct Payouts • AI Co-Host Aura • " +
    "Real-Time Translation • Audio Rooms • Watch Parties • Content Marketplace • " +
    "Free · Creator · Pro · Studio Tiers Available — Stream Your Culture";

  return (
    <div
      className="chiron-bar"
      role="status"
      aria-label="CYLive broadcast status bar"
    >
      {/* Live dot */}
      <div className="chiron-bar__live-dot" />

      {/* Channel label */}
      <span className="chiron-bar__label">CYLive</span>

      {/* Scrolling ticker */}
      <div style={{ overflow: "hidden", flex: 1 }}>
        <span className="chiron-bar__ticker">
          {tickerText || defaultTicker}
        </span>
      </div>

      {/* Timestamp */}
      <span className="chiron-bar__label" suppressHydrationWarning>
        {new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}
      </span>
    </div>
  );
}

export default ChironBar;
