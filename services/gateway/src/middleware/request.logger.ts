import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logger } from '../config/logger';

export const requestLogger: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();
  const { method, url, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.jwtUser?.sub || 'anonymous';

    logger.info('Request completed', {
      method,
      url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip,
      userId,
    });
  });

  next();
};
