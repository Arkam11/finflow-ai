import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { env } from './config/env';
import { requestLogger } from './middleware/request.logger';
import { register, httpRequestCounter, httpRequestDuration } from './config/metrics';
import proxyRoutes from './routes/proxy.routes';
import healthRoutes from './routes/health.routes';
import { logger } from './config/logger';

export const createApp = async () => {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  const limiter = rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Too many requests',
      timestamp: new Date().toISOString(),
    },
  });
  app.use(limiter);

  app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer({ method: req.method, route: req.path });
    res.on('finish', () => {
      httpRequestCounter.inc({ method: req.method, route: req.path, status: res.statusCode });
      end();
    });
    next();
  });

  app.use(requestLogger);

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [
      {
        requestDidStart: async () => ({
          didEncounterErrors: async ({ errors }) => {
            errors.forEach((err) => logger.error('GraphQL error', { error: err.message }));
          },
        }),
      },
    ],
  });

  await apolloServer.start();

  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }: { req: import('express').Request }) => {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) return {};
        try {
          const jwt = await import('jsonwebtoken');
          const token = authHeader.split(' ')[1];
          const payload = jwt.default.verify(token, env.jwt.accessSecret) as {
            sub: string;
            email: string;
          };
          return { token, userId: payload.sub };
        } catch {
          return {};
        }
      },
    }),
  );

  app.use(express.json());
  app.use('/', healthRoutes);
  app.use('/', proxyRoutes);

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
      timestamp: new Date().toISOString(),
    });
  });

  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Unhandled gateway error', { error: err.message });
      res.status(500).json({
        success: false,
        error: 'Internal gateway error',
        timestamp: new Date().toISOString(),
      });
    },
  );

  return app;
};
