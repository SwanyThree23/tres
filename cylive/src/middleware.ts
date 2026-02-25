// ──────────────────────────────────────────────────────────────────────────────
// CYLive — NextAuth Middleware
// Protects dashboard routes, redirects unauthenticated users to login
// ──────────────────────────────────────────────────────────────────────────────

import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(_req) {
    // Middleware logic — currently passes through after auth check
    return;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

// Only protect dashboard routes — keep auth and API routes public
export const config = {
  matcher: [
    "/",
    "/studio/:path*",
    "/browse/:path*",
    "/watch/:path*",
    "/analytics/:path*",
    "/marketplace/:path*",
    "/audio-rooms/:path*",
    "/scheduler/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
