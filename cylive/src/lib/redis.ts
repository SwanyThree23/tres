// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Redis Client
// Session caching, real-time pub/sub, rate limiting, translation cache
// ──────────────────────────────────────────────────────────────────────────────

import { createClient, type RedisClientType } from "redis";

const globalForRedis = globalThis as unknown as {
  redis: RedisClientType | undefined;
};

function createRedisClient(): RedisClientType {
  const client = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

  client.on("error", (err) => console.error("[Redis] Client Error:", err));
  client.on("connect", () => console.log("[Redis] Connected"));

  return client as RedisClientType;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// ── Helper: Ensure Connected ────────────────────────────────────────────────
export async function getRedis(): Promise<RedisClientType> {
  if (!redis.isOpen) {
    await redis.connect();
  }
  return redis;
}

// ── Rate Limiting ───────────────────────────────────────────────────────────

/**
 * Check and increment rate limit for Aura AI calls.
 * Key format: `aura:rate:{streamId}:{hourSlot}`
 * Returns { allowed: boolean, remaining: number }
 */
export async function checkAuraRateLimit(
  streamId: string,
  maxPerHour: number = 20,
): Promise<{ allowed: boolean; remaining: number }> {
  const r = await getRedis();
  const hourSlot = Math.floor(Date.now() / 3600000);
  const key = `aura:rate:${streamId}:${hourSlot}`;

  const current = await r.incr(key);

  // Set expiry on first increment (1 hour + 60s buffer)
  if (current === 1) {
    await r.expire(key, 3660);
  }

  const allowed = current <= maxPerHour;
  const remaining = Math.max(0, maxPerHour - current);

  return { allowed, remaining };
}

// ── Translation Cache ───────────────────────────────────────────────────────

/**
 * Cache a translation. Key format: `translate:{hash}:{targetLang}`
 * TTL: 24 hours
 */
export async function getCachedTranslation(
  textHash: string,
  targetLang: string,
): Promise<string | null> {
  const r = await getRedis();
  return r.get(`translate:${textHash}:${targetLang}`);
}

export async function setCachedTranslation(
  textHash: string,
  targetLang: string,
  translation: string,
): Promise<void> {
  const r = await getRedis();
  await r.setEx(`translate:${textHash}:${targetLang}`, 86400, translation);
}

// ── Session Caching ─────────────────────────────────────────────────────────

export async function cacheSession(
  sessionId: string,
  data: Record<string, unknown>,
  ttlSeconds: number = 3600,
): Promise<void> {
  const r = await getRedis();
  await r.setEx(`session:${sessionId}`, ttlSeconds, JSON.stringify(data));
}

export async function getCachedSession(
  sessionId: string,
): Promise<Record<string, unknown> | null> {
  const r = await getRedis();
  const data = await r.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

// ── Viewer Count ────────────────────────────────────────────────────────────

export async function incrementViewerCount(streamId: string): Promise<number> {
  const r = await getRedis();
  return r.incr(`stream:viewers:${streamId}`);
}

export async function decrementViewerCount(streamId: string): Promise<number> {
  const r = await getRedis();
  const count = await r.decr(`stream:viewers:${streamId}`);
  return Math.max(0, count);
}

export async function getViewerCount(streamId: string): Promise<number> {
  const r = await getRedis();
  const count = await r.get(`stream:viewers:${streamId}`);
  return count ? parseInt(count, 10) : 0;
}

export default redis;
