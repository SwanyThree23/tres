// ──────────────────────────────────────────────────────────────────────────────
// CYLive — NextAuth Type Extensions
// Extends the default Session & JWT types with CYLive user fields
// ──────────────────────────────────────────────────────────────────────────────

import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      avatarUrl?: string | null;
      displayName?: string | null;
      username?: string | null;
      role?: "VIEWER" | "CREATOR" | "ADMIN";
      tier?: "FREE" | "CREATOR" | "PRO" | "STUDIO";
      verified?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    avatarUrl?: string | null;
    displayName?: string | null;
    username?: string | null;
    role?: "VIEWER" | "CREATOR" | "ADMIN";
    tier?: "FREE" | "CREATOR" | "PRO" | "STUDIO";
    verified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: "VIEWER" | "CREATOR" | "ADMIN";
    tier?: "FREE" | "CREATOR" | "PRO" | "STUDIO";
    username?: string | null;
    displayName?: string | null;
    verified?: boolean;
  }
}
