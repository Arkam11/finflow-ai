import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types/ai.types';

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
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
    req.jwtUser = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};
