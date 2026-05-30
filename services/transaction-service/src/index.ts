import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase } from './config/database';
import { getProducer, disconnectProducer } from './config/kafka';
import app from './app';

const bootstrap = async (): Promise<void> => {
  try {
    await connectDatabase();
    await getProducer();

    const server = app.listen(env.port, () => {
      logger.info(`Transaction service running on port ${env.port}`);
    });

    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      await disconnectProducer();
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start transaction service', { error });
    process.exit(1);
  }
};

bootstrap();
