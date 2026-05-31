import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../config/logger';

let _redis: Redis | null = null;

export const getRedis = (): Redis => {
  if (!_redis) {
    _redis = new Redis({
      host: env.redis.host,
      port: env.redis.port,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      lazyConnect: true,
    });
    _redis.on('connect', () => logger.info('GraphQL cache Redis connected'));
    _redis.on('error', () => {
      /* suppress */
    });
  }
  return _redis;
};

export const getCached = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await getRedis().get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const setCached = async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
  try {
    await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.warn('Cache set failed', { key, err });
  }
};

export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    const keys = await getRedis().keys(pattern);
    if (keys.length > 0) await getRedis().del(...keys);
  } catch (err) {
    logger.warn('Cache invalidation failed', { pattern, err });
  }
};

export const disconnectCache = async (): Promise<void> => {
  if (_redis) {
    await _redis.quit().catch(() => {
      /* ignore */
    });
    _redis = null;
  }
};
