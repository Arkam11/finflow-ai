import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { err }));
