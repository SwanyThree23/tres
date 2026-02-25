// ──────────────────────────────────────────────────────────────────────────────
// CYLive — BroadcastCard Component
// Reusable card with corner bracket decorations via CSS pseudo-elements
// Must appear on all primary content cards
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";

interface BroadcastCardProps {
  children: React.ReactNode;
  /** Compact variant with smaller brackets and padding */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

export function BroadcastCard({
  children,
  compact = false,
  className = "",
  onClick,
}: BroadcastCardProps) {
  return (
    <div
      className={`broadcast-card ${compact ? "broadcast-card--compact" : ""} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="broadcast-card__inner">{children}</div>
    </div>
  );
}

export default BroadcastCard;
