// ──────────────────────────────────────────────────────────────────────────────
// CYLive — SignalBars Component
// 5 animated vertical bars that pulse like a broadcast signal
// REQUIRED IN: header, chat header, stream viewer header, studio on-air bar
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";

interface SignalBarsProps {
  size?: "sm" | "md" | "lg";
  color?: "accent" | "green" | "cyan" | "gold";
  className?: string;
}

export function SignalBars({
  size = "md",
  color = "accent",
  className = "",
}: SignalBarsProps) {
  const sizeClass =
    size === "sm" ? "signal-bars--sm" : size === "lg" ? "signal-bars--lg" : "";
  const colorClass = color !== "accent" ? `signal-bars--${color}` : "";

  return (
    <div
      className={`signal-bars ${sizeClass} ${colorClass} ${className}`}
      role="img"
      aria-label="Broadcast signal active"
    >
      <div className="signal-bar" />
      <div className="signal-bar" />
      <div className="signal-bar" />
      <div className="signal-bar" />
      <div className="signal-bar" />
    </div>
  );
}

export default SignalBars;
