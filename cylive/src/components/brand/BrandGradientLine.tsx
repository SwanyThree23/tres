// ──────────────────────────────────────────────────────────────────────────────
// CYLive — BrandGradientLine Component
// BRAND SIGNATURE #1 — 2px gradient line at the top of every page
// accent → gold → cyan → green → purple → transparent
// PERMANENT — never remove, hide, or conditionally render
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";

export function BrandGradientLine() {
  return (
    <div
      className="brand-gradient-line"
      role="presentation"
      aria-hidden="true"
    />
  );
}

export default BrandGradientLine;
