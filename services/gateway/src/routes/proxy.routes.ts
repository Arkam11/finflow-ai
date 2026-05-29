import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { env } from '../config/env';
import { verifyJwt } from '../middleware/auth.middleware';
import { logger } from '../config/logger';

const router = Router();

const proxyOptions = (target: string, pathRewrite?: Record<string, string>) => ({
  target,
  changeOrigin: true,
  pathRewrite,
  on: {
    error: (err: Error, _req: unknown, res: unknown) => {
      logger.error('Proxy error', { target, error: err.message });
      const response = res as { status: (code: number) => { json: (body: unknown) => void } };
      response.status(502).json({
        success: false,
        error: 'Service temporarily unavailable',
        timestamp: new Date().toISOString(),
      });
    },
  },
});

// Public routes — no JWT required
router.use('/auth', createProxyMiddleware(proxyOptions(env.services.auth)));

// Protected routes — JWT required before forwarding
router.use(
  '/accounts',
  verifyJwt,
  createProxyMiddleware(proxyOptions(env.services.account, { '^/accounts': '/accounts' })),
);

router.use(
  '/transactions',
  verifyJwt,
  createProxyMiddleware(
    proxyOptions(env.services.transaction, { '^/transactions': '/transactions' }),
  ),
);

router.use(
  '/ai',
  verifyJwt,
  createProxyMiddleware(proxyOptions(env.services.ai, { '^/ai': '/ai' })),
);

router.use(
  '/analytics',
  verifyJwt,
  createProxyMiddleware(proxyOptions(env.services.analytics, { '^/analytics': '/analytics' })),
);

router.use(
  '/retail',
  verifyJwt,
  createProxyMiddleware(proxyOptions(env.services.retail, { '^/retail': '/retail' })),
);

export default router;
