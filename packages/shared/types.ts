// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Shared Types
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'CREATOR' | 'ADMIN';
export type StageStatus = 'UPCOMING' | 'LIVE' | 'ENDED';
export type GuestRole = 'HOST' | 'GUEST' | 'VIEWER';
export type Platform = 'YOUTUBE' | 'TWITCH' | 'TIKTOK' | 'FACEBOOK' | 'CUSTOM' | 'OBS' | 'WHIP';
export type TxType = 'SUPER_CHAT' | 'SUBSCRIPTION' | 'TIP' | 'PRODUCT_SALE';
export type TxStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type SubscriptionTier = 'BRONZE' | 'SILVER' | 'GOLD';

// ── User ─────────────────────────────────────────────────────────────────────

export interface UserPublic {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: UserRole;
  createdAt: string;
}

export interface UserProfile extends UserPublic {
  email: string;
  emailVerified: boolean;
  chargesEnabled: boolean;
  stripeAccountId: string | null;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ── Stage ────────────────────────────────────────────────────────────────────

export interface Stage {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: StageStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  viewerCount: number;
  peakViewers: number;
  isPrivate: boolean;
  creatorId: string;
  creator?: UserPublic;
  createdAt: string;
}

// ── Transaction ──────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  type: TxType;
  status: TxStatus;
  grossAmount: number;
  platformFee: number;
  creatorAmount: number;
  currency: string;
  fromUserId: string;
  toUserId: string;
  stageId: string | null;
  createdAt: string;
}

// ── Subscription ─────────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  tier: SubscriptionTier;
  status: string;
  subscriberId: string;
  creatorId: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

// ── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  status: string;
  stock: number | null;
  creatorId: string;
  creator?: UserPublic;
  createdAt: string;
}

// ── Immutable Fee Constants ──────────────────────────────────────────────────
// These are exported for display/documentation purposes ONLY.
// The actual enforcement happens at 3 layers (service, DB trigger, ledger).

export const TIER_AMOUNTS = {
  BRONZE: 1.00,
  SILVER: 5.00,
  GOLD: 15.00,
} as const;

export const PLATFORM_FEE_RATE = 0.10 as const;
export const CREATOR_SHARE_RATE = 0.90 as const;

// ── Socket Events ────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  stageId: string;
  user?: UserPublic;
  createdAt: string;
}

export interface SuperChatEvent {
  stageId: string;
  fromUser: { username: string; displayName: string };
  amount: number;
  message: string;
}

export interface WatchPartySync {
  timestamp: number;
  playing: boolean;
  syncedBy: string;
}

// ── API Response Types ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface EarningsResponse {
  total: {
    creatorEarnings: number;
    grossRevenue: number;
    count: number;
  };
  week: {
    creatorEarnings: number;
    count: number;
  };
  month: {
    creatorEarnings: number;
    count: number;
  };
  byType: Array<{
    type: TxType;
    creatorEarnings: number;
    grossRevenue: number;
    count: number;
  }>;
}
