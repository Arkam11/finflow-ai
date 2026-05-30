import express from 'express';
import { env } from './config/env';
import { logger } from './config/logger';
import { startConsumer, stopConsumer } from './consumers/kafka.consumer';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: { status: 'healthy', service: 'notification-service' },
    timestamp: new Date().toISOString(),
  });
});

const bootstrap = async (): Promise<void> => {
  try {
    await startConsumer();

    const server = app.listen(env.port, () => {
      logger.info(`Notification service running on port ${env.port}`);
    });

    const shutdown = async () => {
      logger.info('Shutting down notification service...');
      await stopConsumer();
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start notification service', { error });
    process.exit(1);
  }
};

bootstrap();
