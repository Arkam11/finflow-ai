import { Router, Request, Response } from 'express';
import { env } from '../config/env';
import { logger } from '../config/logger';

const router = Router();

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'unreachable';
  responseTime?: number;
}

const checkService = async (name: string, url: string): Promise<ServiceHealth> => {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${url}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - start,
    };
  } catch {
    logger.warn(`Health check failed for ${name}`, { url });
    return { status: 'unreachable' };
  }
};

router.get('/health', async (_req: Request, res: Response) => {
  const checks = await Promise.allSettled([
    checkService('auth', env.services.auth),
    checkService('account', env.services.account),
    checkService('transaction', env.services.transaction),
    checkService('ai', env.services.ai),
    checkService('analytics', env.services.analytics),
    checkService('retail', env.services.retail),
  ]);

  const serviceNames = ['auth', 'account', 'transaction', 'ai', 'analytics', 'retail'];
  const services: Record<string, ServiceHealth> = {};

  checks.forEach((result, index) => {
    services[serviceNames[index]] =
      result.status === 'fulfilled' ? result.value : { status: 'unreachable' };
  });

  const allHealthy = Object.values(services).every((s) => s.status === 'healthy');
  const anyHealthy = Object.values(services).some((s) => s.status === 'healthy');

  const overallStatus = allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy';

  res.status(allHealthy ? 200 : 207).json({
    success: true,
    data: {
      status: overallStatus,
      gateway: 'healthy',
      services,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
