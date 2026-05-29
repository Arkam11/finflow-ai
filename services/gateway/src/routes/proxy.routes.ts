import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { env } from '../config/env';
import { verifyJwt } from '../middleware/auth.middleware';
import { logger } from '../config/logger';

const router = Router();

const makeProxy = (target: string, prefix: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { '^/': `/${prefix}/` },
    on: {
      error: (err: Error, _req: unknown, res: unknown) => {
        logger.error('Proxy error', { target, error: err.message });
        const r = res as { status: (c: number) => { json: (b: unknown) => void } };
        r.status(502).json({
          success: false,
          error: 'Service temporarily unavailable',
          timestamp: new Date().toISOString(),
        });
      },
    },
  });

router.use('/auth', makeProxy(env.services.auth, 'auth'));

router.use('/accounts', verifyJwt, makeProxy(env.services.account, 'accounts'));
router.use('/transactions', verifyJwt, makeProxy(env.services.transaction, 'transactions'));
router.use('/ai', verifyJwt, makeProxy(env.services.ai, 'ai'));
router.use('/analytics', verifyJwt, makeProxy(env.services.analytics, 'analytics'));
router.use('/retail', verifyJwt, makeProxy(env.services.retail, 'retail'));

export default router;
