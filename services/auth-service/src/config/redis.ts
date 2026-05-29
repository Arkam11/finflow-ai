import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => logger.info('Redis connected successfully'));
redis.on('error', (err) => logger.error('Redis error', { err }));

export const storeRefreshToken = async (
  userId: string,
  refreshToken: string,
  expirySeconds: number,
): Promise<void> => {
  await redis.setex(`refresh:${userId}`, expirySeconds, refreshToken);
};

export const getRefreshToken = async (userId: string): Promise<string | null> => {
  return redis.get(`refresh:${userId}`);
};

export const deleteRefreshToken = async (userId: string): Promise<void> => {
  await redis.del(`refresh:${userId}`);
};

export const blacklistToken = async (token: string, expirySeconds: number): Promise<void> => {
  await redis.setex(`blacklist:${token}`, expirySeconds, '1');
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redis.get(`blacklist:${token}`);
  return result === '1';
};
