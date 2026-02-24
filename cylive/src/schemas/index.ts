// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Zod Validation Schemas
// Client + Server shared validation
// ──────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

// ── Auth Schemas ────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  displayName: z.string().min(1, "Display name is required").max(50),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ── Stream Schemas ──────────────────────────────────────────────────────────

export const streamGenres = [
  "TALK_SHOW",
  "MUSIC",
  "GAMING",
  "LIFESTYLE",
  "EDUCATION",
  "SPORTS",
  "NEWS",
  "COMEDY",
  "ART",
  "TECHNOLOGY",
  "OTHER",
] as const;

export const createStreamSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().max(500).optional(),
  genre: z.enum(streamGenres).default("OTHER"),
  panelCount: z.number().int().min(1).max(9).default(1),
  isPaywalled: z.boolean().default(false),
  paywallAmountCents: z.number().int().min(100).max(50000).optional(),
  auraMode: z.enum(["SASSY", "HYPE", "CALM", "KIND"]).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const updateStreamSchema = createStreamSchema.partial();

export type CreateStreamInput = z.infer<typeof createStreamSchema>;
export type UpdateStreamInput = z.infer<typeof updateStreamSchema>;

// ── Payment Schemas ─────────────────────────────────────────────────────────

export const tipSchema = z.object({
  recipientId: z.string().uuid("Invalid recipient ID"),
  amountCents: z
    .number()
    .int()
    .min(100, "Minimum tip is $1.00")
    .max(100000, "Maximum tip is $1,000.00"),
  streamId: z.string().uuid().optional(),
  message: z.string().max(200).optional(),
});

export const subscribeSchema = z.object({
  creatorId: z.string().uuid("Invalid creator ID"),
  tier: z.enum(["FAN", "SUPPORTER", "RIDE_OR_DIE"]),
});

export const paywallAccessSchema = z.object({
  streamId: z.string().uuid("Invalid stream ID"),
});

export type TipInput = z.infer<typeof tipSchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;

// ── Message Schemas ─────────────────────────────────────────────────────────

export const messageSchema = z.object({
  streamId: z.string().uuid("Invalid stream ID"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(500, "Message too long"),
  isSuperChat: z.boolean().default(false),
  superAmountCents: z.number().int().min(100).max(50000).optional(),
  isGift: z.boolean().default(false),
  giftType: z.string().max(50).optional(),
});

export type MessageInput = z.infer<typeof messageSchema>;

// ── User Profile Schemas ────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional(),
  avatarEmoji: z.string().max(2).optional(),
  preferredLanguage: z
    .enum([
      "en",
      "es",
      "fr",
      "de",
      "pt",
      "ja",
      "ko",
      "zh",
      "ar",
      "hi",
      "ru",
      "tr",
    ])
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ── Video Post Schemas ──────────────────────────────────────────────────────

export const createVideoPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  videoUrl: z.string().url("Invalid video URL"),
  cdnUrl: z.string().url().optional(),
  duration: z.number().int().positive().optional(),
  isPaywalled: z.boolean().default(false),
  paywallAmountCents: z.number().int().min(100).max(50000).optional(),
});

export type CreateVideoPostInput = z.infer<typeof createVideoPostSchema>;

// ── Upload Schemas ──────────────────────────────────────────────────────────

export const uploadRequestSchema = z.object({
  contentType: z.string().min(1),
  fileExtension: z.string().min(1).max(10),
  fileType: z.enum(["video", "image", "avatar"]),
});

export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;

// ── Scheduled Stream Schemas ────────────────────────────────────────────────

export const scheduledStreamSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  scheduledAt: z.string().datetime(),
  panelCount: z.number().int().min(1).max(9).default(1),
  genre: z.enum(streamGenres).default("OTHER"),
  notifyFollowers: z.boolean().default(true),
});

export type ScheduledStreamInput = z.infer<typeof scheduledStreamSchema>;

// ── Audio Room Schemas ──────────────────────────────────────────────────────

export const createAudioRoomSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  maxSpeakers: z.number().int().min(2).max(20).default(10),
});

export type CreateAudioRoomInput = z.infer<typeof createAudioRoomSchema>;
