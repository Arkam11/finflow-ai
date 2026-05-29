import { env } from './config/env';
import { logger } from './config/logger';
import app from './app';

const server = app.listen(env.port, () => {
  logger.info(`API Gateway running on port ${env.port}`);
  logger.info(`Environment: ${env.nodeEnv}`);
  logger.info(
    'Registered routes: /health, /auth/*, /accounts/*, /transactions/*, /ai/*, /analytics/*, /retail/*',
  );
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(() => {
    logger.info('Gateway shut down');
    process.exit(0);
  });
});

export default server;
