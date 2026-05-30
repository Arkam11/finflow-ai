import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase } from './config/database';
import { redis } from './config/redis';
import app from './app';

const bootstrap = async (): Promise<void> => {
  try {
    await connectDatabase();
    await redis.ping();
    logger.info('Redis ready');

    const server = app.listen(env.port, () => {
      logger.info(`AI service running on port ${env.port}`);
      logger.info(`Model: ${env.anthropic.model}`);
    });

    const shutdown = () => {
      logger.info('Shutting down AI service...');
      server.close(() => {
        redis.disconnect();
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start AI service', { error });
    process.exit(1);
  }
};

bootstrap();
