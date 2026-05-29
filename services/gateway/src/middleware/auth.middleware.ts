import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { JwtPayload } from '../utils/types';

declare module 'express-serve-static-core' {
  interface Request {
    jwtUser?: JwtPayload;
  }
}

export const verifyJwt: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authorization header missing or malformed',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
    req.jwtUser = payload;
    next();
  } catch (error) {
    logger.warn('JWT verification failed', { error });
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
};

export const requireRole = (...roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.jwtUser) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!roles.includes(req.jwtUser.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};
