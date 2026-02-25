// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Badge Component
// Sizes: xs (8px), sm (9px), md (10px)
// Variants: live, gold, pro, cyan, tier-*
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  size?: "xs" | "sm" | "md";
  variant?: "default" | "live" | "gold" | "pro" | "cyan" | "accent";
  className?: string;
}

export function Badge({
  children,
  size = "sm",
  variant = "default",
  className = "",
}: BadgeProps) {
  const sizeClass = `badge--${size}`;

  const variantClasses: Record<string, string> = {
    default:
      "bg-white/5 text-[var(--text-muted)] border border-[var(--border)]",
    live: "badge-live",
    gold: "badge-gold",
    pro: "badge-pro",
    cyan: "badge-cyan",
    accent:
      "bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/20",
  };

  // For live variant, use the pre-built class
  if (variant === "live") {
    return (
      <span className={`badge-live ${className}`}>
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "white",
            animation: "live-pulse 2s ease-in-out infinite",
          }}
        />
        {children}
      </span>
    );
  }

  // For gold/pro/cyan, use pre-built classes
  if (variant === "gold" || variant === "pro" || variant === "cyan") {
    return <span className={`badge-${variant} ${className}`}>{children}</span>;
  }

  return (
    <span
      className={`badge ${sizeClass} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// ── Tier Badge ────────────────────────────────────────────────────────────

interface TierBadgeProps {
  tier: "FREE" | "CREATOR" | "PRO" | "STUDIO";
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function TierBadge({
  tier,
  size = "sm",
  className = "",
}: TierBadgeProps) {
  const tierClass = `tier-badge--${tier.toLowerCase()}`;
  const sizeClass = `tier-badge--${size}`;

  const labels: Record<string, string> = {
    FREE: "Free",
    CREATOR: "Creator",
    PRO: "Pro",
    STUDIO: "Studio",
  };

  const icons: Record<string, string> = {
    FREE: "",
    CREATOR: "◆",
    PRO: "★",
    STUDIO: "◈",
  };

  return (
    <span className={`tier-badge ${tierClass} ${sizeClass} ${className}`}>
      {icons[tier] && <span>{icons[tier]}</span>}
      {labels[tier]}
    </span>
  );
}

export { Badge as default };
