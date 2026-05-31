import { env } from './config/env';
import { logger } from './config/logger';
import { createApp } from './app';

const bootstrap = async () => {
  const app = await createApp();

  const server = app.listen(env.port, () => {
    logger.info(`API Gateway running on port ${env.port}`);
    logger.info(`Environment: ${env.nodeEnv}`);
    logger.info('GraphQL endpoint: http://localhost:3000/graphql');
    logger.info('Metrics endpoint: http://localhost:3000/metrics');
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received — shutting down gracefully');
    server.close(() => {
      logger.info('Gateway shut down');
      process.exit(0);
    });
  });
};

bootstrap().catch((err) => {
  console.error('Failed to start gateway', err);
  process.exit(1);
});
