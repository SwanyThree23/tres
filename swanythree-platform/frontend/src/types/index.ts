/**
 * SwanyThree Platform — Complete TypeScript Type Definitions
 */

// ── Auth Types ──────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: 'admin' | 'moderator' | 'creator' | 'viewer';
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface RegisterResponse extends LoginResponse {}

// ── Stream Types ────────────────────────────────────────────────────

export type StreamMode = 'solo' | 'panel_video' | 'panel_audio' | 'watch_party' | 'interview';
export type StreamVisibility = 'public' | 'private' | 'unlisted' | 'subscribers' | 'paywall';
export type StreamStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export interface Stream {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  mode: StreamMode;
  visibility: StreamVisibility;
  status: StreamStatus;
  paywall_price: number;
  tip_minimum: number;
  stream_key: string;
  rtmp_url: string | null;
  hls_url: string | null;
  webrtc_room_id: string | null;
  peak_viewers: number;
  total_viewers: number;
  total_revenue: number;
  chat_messages: number;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  is_recording: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  host_username?: string;
  host_display_name?: string;
  host_avatar_url?: string;
}

export interface StreamGuest {
  id: string;
  stream_id: string;
  user_id: string | null;
  guest_name: string;
  role: 'co-host' | 'guest' | 'viewer';
  status: 'invited' | 'connected' | 'disconnected';
  invite_token: string;
  has_video: boolean;
  has_audio: boolean;
  is_muted_by_host: boolean;
  joined_at: string | null;
  created_at: string;
}

// ── Payment Types ───────────────────────────────────────────────────

export interface Transaction {
  id: string;
  stream_id: string | null;
  sender_id: string | null;
  recipient_id: string;
  type: 'tip' | 'paywall' | 'subscription' | 'payout';
  gross_amount: number;
  platform_fee: number;
  processor_fee: number;
  net_amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  message: string | null;
  created_at: string;
}

export interface FeeBreakdown {
  gross_amount: number;
  processor_fee: number;
  platform_fee: number;
  creator_amount: number;
}

export interface RevenueReport {
  period: string;
  total_gross: number;
  total_platform_fee: number;
  total_processor_fee: number;
  total_net: number;
  transaction_count: number;
}

export interface Payout {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  period_start: string;
  period_end: string;
  transaction_count: number;
  created_at: string;
}

// ── Gamification Types ──────────────────────────────────────────────

export interface GamificationProfile {
  total_xp: number;
  level: number;
  level_title: string;
  next_level_xp: number;
  progress_pct: number;
  current_streak: number;
  best_streak: number;
  streak_multiplier: number;
  last_active_date: string | null;
  total_streams: number;
  total_stream_minutes: number;
  total_tips_sent: number;
  total_tips_received: number;
  badge_count: number;
  weekly_xp: number;
  monthly_xp: number;
  badges: UserBadge[];
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: 'streaming' | 'social' | 'revenue' | 'achievement';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
}

export interface UserBadge extends Badge {
  earned_at: string | null;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  xp_reward: number;
  current_progress: number;
  completed: boolean;
  progress_pct: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  level_title: string;
}

// ── Gamification Events ─────────────────────────────────────────────

export type GamificationEvent =
  | { type: 'xp_gained'; xp_earned: number; new_total: number; action: string; multiplier: number }
  | { type: 'level_up'; new_level: number; new_title: string }
  | { type: 'badge_earned'; badge: Badge }
  | { type: 'challenge_completed'; title: string; xp_reward: number }
  | { type: 'streak_updated'; current_streak: number; multiplier: number; broken: boolean };

// ── Chat Types ──────────────────────────────────────────────────────

export type ChatPlatform = 'native' | 'youtube' | 'twitch' | 'kick' | 'tiktok' | 'discord' | 'facebook' | 'x' | 'instagram' | 'telegram' | 'custom';
export type ChatMessageType = 'message' | 'system' | 'bot' | 'tip' | 'announcement';

export interface ChatMessage {
  id: string;
  stream_id: string;
  user_id: string | null;
  username: string;
  content: string;
  platform: ChatPlatform;
  type: ChatMessageType;
  is_pinned: boolean;
  moderation_status: string;
  created_at: string;
  timestamp?: number;
}

export interface ChatBan {
  id: string;
  stream_id: string;
  user_id: string;
  banned_by: string;
  reason: string | null;
  ban_type: 'stream' | 'platform';
  expires_at: string | null;
  created_at: string;
}

// ── Recording Types ─────────────────────────────────────────────────

export interface Recording {
  id: string;
  stream_id: string;
  title: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  file_size_bytes: number;
  format: string;
  resolution: string | null;
  transcode_status: 'pending' | 'processing' | 'complete' | 'failed';
  created_at: string;
}

// ── Watch Party Types ───────────────────────────────────────────────

export interface WatchPartyState {
  stream_id: string;
  host_id: string;
  media_url: string;
  is_playing: boolean;
  current_time: number;
  is_active: boolean;
}

export interface WatchPartySyncPayload {
  stream_id: string;
  host_id: string;
  media_url: string;
  is_playing: boolean;
  current_time: number;
  server_time: number;
  is_active: boolean;
}

// ── Destination Types ───────────────────────────────────────────────

export type DestinationPlatform = 'youtube' | 'twitch' | 'kick' | 'tiktok' | 'facebook' | 'x' | 'custom';

export interface DestinationConfig {
  platform: DestinationPlatform;
  encrypted_key: string;
  resolution: string;
  bitrate: number;
}

export interface FanoutStatus {
  pid: number | null;
  status: 'idle' | 'connecting' | 'live' | 'error' | 'stopped';
  resolution: string;
  bitrate: number;
}

// ── Notification Types ──────────────────────────────────────────────

export interface Notification {
  id: string;
  type: 'follow' | 'tip' | 'badge' | 'level_up' | 'challenge' | 'stream_live' | 'system';
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ── API Response Types ──────────────────────────────────────────────

export interface ApiError {
  error: string;
  detail?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
