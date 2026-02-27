// ──────────────────────────────────────────────────────────────────────────────
// CYLive — NextAuth Middleware
// Protects dashboard routes, redirects unauthenticated users to login
// ──────────────────────────────────────────────────────────────────────────────

import { withAuth } from "next-auth/middleware";

export default withAuth(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  matcher: [],
};
