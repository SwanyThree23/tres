// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Avatar Component
// Speaking ring animation + verified badge
// Sizes: xs (24px), sm (32px), md (40px), lg (56px)
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  emoji?: string;
  size?: "xs" | "sm" | "md" | "lg";
  speaking?: boolean;
  verified?: boolean;
  className?: string;
}

export function Avatar({
  src,
  alt = "User avatar",
  emoji,
  size = "md",
  speaking = false,
  verified = false,
  className = "",
}: AvatarProps) {
  const sizeClass = `avatar--${size}`;
  const speakingClass = speaking ? "avatar--speaking" : "";

  // Fallback sizes for emoji rendering
  const emojiSizes = { xs: "12px", sm: "16px", md: "20px", lg: "28px" };

  return (
    <div className={`avatar ${sizeClass} ${speakingClass} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="avatar__img" loading="lazy" />
      ) : (
        <div
          className="avatar__img"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, var(--accent), var(--cyan))",
            fontSize: emojiSizes[size],
          }}
        >
          {emoji || alt.charAt(0).toUpperCase()}
        </div>
      )}

      {verified && (
        <div className="avatar__verified">
          <svg
            viewBox="0 0 12 12"
            fill="none"
            style={{ width: "60%", height: "60%" }}
          >
            <path
              d="M3 6.5L5 8.5L9 4"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default Avatar;
