// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Rate Limiter Middleware  |  Redis-backed
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import redis from '../lib/redis.js';
import logger from '../lib/logger.js';

interface RateLimitConfig {
  windowMs: number;    // time window in milliseconds
  max: number;         // max requests per window
  keyPrefix?: string;  // Redis key prefix
}

/**
 * Create a Redis-backed sliding-window rate limiter
 */
export function rateLimit(config: RateLimitConfig) {
  const { windowMs, max, keyPrefix = 'rl' } = config;
  const windowSec = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = req.user?.sub ?? req.ip ?? 'unknown';
    const key = `${keyPrefix}:${identifier}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSec);
      }

      // Set rate limit headers
      const ttl = await redis.ttl(key);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + ttl);

      if (current > max) {
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: ttl,
        });
        return;
      }

      next();
    } catch (err) {
      // If Redis is down, allow the request through (fail-open)
      logger.error({ err }, 'Rate limiter Redis error — fail-open');
      next();
    }
  };
}

// Pre-configured limiters
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  keyPrefix: 'rl:api',
});

export const authLimiter = rateLimit({
  windowMs: 900_000, // 15 min
  max: 20,
  keyPrefix: 'rl:auth',
});

export const webhookLimiter = rateLimit({
  windowMs: 60_000,
  max: 200,
  keyPrefix: 'rl:wh',
});
