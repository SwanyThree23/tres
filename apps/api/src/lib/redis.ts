// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Redis Client
// ─────────────────────────────────────────────────────────────────────────────

import Redis from 'ioredis';
import logger from './logger.js';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 5,
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 5000);
    logger.warn({ attempt: times, delay }, 'Redis reconnecting...');
    return delay;
  },
  lazyConnect: false,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error({ err }, 'Redis error'));

// Separate instances for Socket.io adapter (pub/sub)
export const redisPub = new Redis(REDIS_URL, { lazyConnect: true });
export const redisSub = new Redis(REDIS_URL, { lazyConnect: true });

export default redis;
