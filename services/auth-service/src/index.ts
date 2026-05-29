import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase } from './config/database';
import { redis } from './config/redis';
import app from './app';

const bootstrap = async (): Promise<void> => {
  try {
    await connectDatabase();
    logger.info('Database ready');

    await redis.ping();
    logger.info('Redis ready');

    app.listen(env.port, () => {
      logger.info(`Auth service running on port ${env.port}`);
    });
  } catch (error) {
    logger.error('Failed to start auth service', { error });
    process.exit(1);
  }
};

bootstrap();
