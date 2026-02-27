// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Client-Side Providers
// SessionProvider (NextAuth) + SWR + Framer Motion
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import { SocketProvider } from "./SocketProvider";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SocketProvider>
        <SWRConfig
          value={{
            fetcher,
            revalidateOnFocus: false,
            dedupingInterval: 5000,
            errorRetryCount: 3,
          }}
        >
          {children}
        </SWRConfig>
      </SocketProvider>
    </SessionProvider>
  );
}
