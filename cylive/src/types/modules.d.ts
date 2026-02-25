// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Module declarations for packages whose types the IDE cannot resolve
// These packages DO ship their own types, but the IDE may cache stale resolution
// ──────────────────────────────────────────────────────────────────────────────

declare module "framer-motion" {
  import type {
    ComponentType,
    ReactElement,
    ReactNode,
    CSSProperties,
  } from "react";

  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    variants?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    whileInView?: any;
    className?: string;
    style?: CSSProperties;
    custom?: any;
    children?: ReactNode;
    onClick?: (e: any) => void;
    [key: string]: any;
  }

  export const motion: {
    div: ComponentType<MotionProps>;
    span: ComponentType<MotionProps>;
    p: ComponentType<MotionProps>;
    h1: ComponentType<MotionProps>;
    h2: ComponentType<MotionProps>;
    h3: ComponentType<MotionProps>;
    button: ComponentType<MotionProps>;
    a: ComponentType<MotionProps>;
    ul: ComponentType<MotionProps>;
    li: ComponentType<MotionProps>;
    img: ComponentType<MotionProps>;
    section: ComponentType<MotionProps>;
    nav: ComponentType<MotionProps>;
    header: ComponentType<MotionProps>;
    footer: ComponentType<MotionProps>;
    [key: string]: ComponentType<MotionProps>;
  };

  export function AnimatePresence(props: {
    children?: ReactNode;
    mode?: "sync" | "wait" | "popLayout";
    initial?: boolean;
    onExitComplete?: () => void;
  }): ReactElement;
}

declare module "lucide-react" {
  import type { ComponentType, SVGAttributes } from "react";

  interface LucideProps extends SVGAttributes<SVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    className?: string;
  }

  type LucideIcon = ComponentType<LucideProps>;

  // Navigation & UI
  export const Home: LucideIcon;
  export const Search: LucideIcon;
  export const Settings: LucideIcon;
  export const Menu: LucideIcon;
  export const X: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowUp: LucideIcon;
  export const ArrowDown: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const MoreVertical: LucideIcon;
  export const Grid3X3: LucideIcon;
  export const Grid2X2: LucideIcon;
  export const LayoutGrid: LucideIcon;
  export const List: LucideIcon;
  export const Filter: LucideIcon;
  export const Plus: LucideIcon;
  export const Minus: LucideIcon;

  // Media & Streaming
  export const Play: LucideIcon;
  export const Pause: LucideIcon;
  export const Video: LucideIcon;
  export const VideoOff: LucideIcon;
  export const Mic: LucideIcon;
  export const MicOff: LucideIcon;
  export const Volume2: LucideIcon;
  export const VolumeX: LucideIcon;
  export const ScreenShare: LucideIcon;
  export const Radio: LucideIcon;
  export const Clapperboard: LucideIcon;
  export const Headphones: LucideIcon;
  export const Music: LucideIcon;

  // Social & Communication
  export const Users: LucideIcon;
  export const User: LucideIcon;
  export const UserPlus: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const Send: LucideIcon;
  export const Heart: LucideIcon;
  export const ThumbsUp: LucideIcon;
  export const Star: LucideIcon;
  export const Share2: LucideIcon;
  export const Bell: LucideIcon;
  export const BellOff: LucideIcon;

  // Status & Info
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Info: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const XCircle: LucideIcon;
  export const Clock: LucideIcon;
  export const Timer: LucideIcon;
  export const Activity: LucideIcon;
  export const Zap: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Flame: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const BarChart3: LucideIcon;
  export const PieChart: LucideIcon;
  export const Signal: LucideIcon;

  // Commerce & Finance
  export const DollarSign: LucideIcon;
  export const CreditCard: LucideIcon;
  export const Wallet: LucideIcon;
  export const Gift: LucideIcon;
  export const ShoppingCart: LucideIcon;
  export const Store: LucideIcon;

  // Security
  export const Lock: LucideIcon;
  export const Unlock: LucideIcon;
  export const Shield: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Key: LucideIcon;

  // Files & Data
  export const Copy: LucideIcon;
  export const Download: LucideIcon;
  export const Upload: LucideIcon;
  export const File: LucideIcon;
  export const Image: LucideIcon;
  export const Trash2: LucideIcon;
  export const Edit3: LucideIcon;
  export const Save: LucideIcon;
  export const RefreshCw: LucideIcon;

  // Layout & Design
  export const Calendar: LucideIcon;
  export const CalendarDays: LucideIcon;
  export const Palette: LucideIcon;
  export const Layers: LucideIcon;
  export const Globe: LucideIcon;
  export const MapPin: LucideIcon;
  export const Compass: LucideIcon;
  export const Award: LucideIcon;
  export const Crown: LucideIcon;
  export const Podcast: LucideIcon;
  export const LogOut: LucideIcon;
  export const LogIn: LucideIcon;
  export const Mail: LucideIcon;
  export const Github: LucideIcon;
  export const Twitter: LucideIcon;

  // Catch-all for any icon not listed
  const _default: LucideIcon;
  export default _default;
}

declare module "next-auth/react" {
  import type { Session } from "next-auth";

  export interface SessionContextValue {
    data: Session | null;
    status: "authenticated" | "loading" | "unauthenticated";
    update: (data?: any) => Promise<Session | null>;
  }

  export function useSession(): SessionContextValue;
  export function signIn(
    provider?: string,
    options?: Record<string, any>,
  ): Promise<any>;
  export function signOut(options?: Record<string, any>): Promise<any>;

  export function SessionProvider(props: {
    children: React.ReactNode;
    session?: Session | null;
    refetchInterval?: number;
    refetchOnWindowFocus?: boolean;
  }): React.ReactElement;
}
