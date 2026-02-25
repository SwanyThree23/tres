// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Ambient Type Declarations
// Provides type info for modules the IDE sometimes fails to resolve
// ──────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Framer Motion ───────────────────────────────────────────────────────────

declare module "framer-motion" {
  import { ComponentType, CSSProperties, ReactNode, Ref } from "react";

  export interface MotionProps {
    initial?: string | Record<string, unknown>;
    animate?: string | Record<string, unknown>;
    exit?: string | Record<string, unknown>;
    variants?: Record<string, Record<string, unknown>>;
    transition?: Record<string, unknown>;
    whileHover?: Record<string, unknown>;
    whileTap?: Record<string, unknown>;
    whileInView?: Record<string, unknown>;
    layout?: boolean;
    layoutId?: string;
    className?: string;
    style?: CSSProperties;
    ref?: Ref<unknown>;
    children?: ReactNode;
    [key: string]: unknown;
  }

  export const motion: {
    [K in keyof JSX.IntrinsicElements]: ComponentType<
      MotionProps & JSX.IntrinsicElements[K]
    >;
  };

  export const AnimatePresence: ComponentType<{
    children?: ReactNode;
    mode?: "sync" | "wait" | "popLayout";
    initial?: boolean;
    onExitComplete?: () => void;
  }>;

  export function useMotionValue(initial: number): {
    get: () => number;
    set: (v: number) => void;
  };
  export function useTransform(
    value: ReturnType<typeof useMotionValue>,
    input: number[],
    output: number[],
  ): ReturnType<typeof useMotionValue>;
  export function useSpring(
    value: ReturnType<typeof useMotionValue>,
    config?: Record<string, unknown>,
  ): ReturnType<typeof useMotionValue>;
  export function useAnimation(): {
    start: (variant: string | Record<string, unknown>) => Promise<void>;
    stop: () => void;
  };
}

// ── Lucide React ────────────────────────────────────────────────────────────

declare module "lucide-react" {
  import { ComponentType, SVGProps } from "react";

  interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    className?: string;
  }

  type LucideIcon = ComponentType<LucideProps>;

  // All icons used in the project
  export const Activity: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const Bell: LucideIcon;
  export const Calendar: LucideIcon;
  export const Check: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const Clock: LucideIcon;
  export const Compass: LucideIcon;
  export const Copy: LucideIcon;
  export const CreditCard: LucideIcon;
  export const DollarSign: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Flame: LucideIcon;
  export const Gift: LucideIcon;
  export const Globe: LucideIcon;
  export const Grid3X3: LucideIcon;
  export const Heart: LucideIcon;
  export const Key: LucideIcon;
  export const Lock: LucideIcon;
  export const LogOut: LucideIcon;
  export const Mail: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const Mic: LucideIcon;
  export const MicOff: LucideIcon;
  export const Palette: LucideIcon;
  export const Radio: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Save: LucideIcon;
  export const ScreenShare: LucideIcon;
  export const Search: LucideIcon;
  export const Send: LucideIcon;
  export const Settings: LucideIcon;
  export const Share2: LucideIcon;
  export const Shield: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Star: LucideIcon;
  export const ThumbsUp: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Unlock: LucideIcon;
  export const User: LucideIcon;
  export const UserPlus: LucideIcon;
  export const Users: LucideIcon;
  export const Video: LucideIcon;
  export const VideoOff: LucideIcon;
  export const X: LucideIcon;
  export const Zap: LucideIcon;
}

// ── NextAuth React ──────────────────────────────────────────────────────────

declare module "next-auth/react" {
  import { Session } from "next-auth";

  export interface SessionContextValue {
    data: Session | null;
    status: "authenticated" | "loading" | "unauthenticated";
    update: (data?: Record<string, unknown>) => Promise<Session | null>;
  }

  export function useSession(): SessionContextValue;

  export function signIn(
    provider?: string,
    options?: Record<string, unknown>,
    authorizationParams?: Record<string, string>,
  ): Promise<
    | { error: string | null; status: number; ok: boolean; url: string | null }
    | undefined
  >;

  export function signOut(options?: {
    callbackUrl?: string;
    redirect?: boolean;
  }): Promise<{ url: string }>;

  export function getSession(): Promise<Session | null>;

  export interface SessionProviderProps {
    children: React.ReactNode;
    session?: Session | null;
    basePath?: string;
    refetchInterval?: number;
    refetchOnWindowFocus?: boolean;
    refetchWhenOffline?: boolean;
  }
  export function SessionProvider(props: SessionProviderProps): JSX.Element;
}

// ── NextAuth Middleware ─────────────────────────────────────────────────────

declare module "next-auth/middleware" {
  import { NextMiddleware, NextRequest } from "next/server";

  interface WithAuthOptions {
    callbacks?: {
      authorized?: (params: {
        token: Record<string, unknown> | null;
        req: NextRequest;
      }) => boolean;
    };
    pages?: Record<string, string>;
  }

  export function withAuth(
    middleware: (
      req: NextRequest,
    ) => void | Response | Promise<void | Response>,
    options?: WithAuthOptions,
  ): NextMiddleware;

  export function withAuth(options?: WithAuthOptions): NextMiddleware;
}
