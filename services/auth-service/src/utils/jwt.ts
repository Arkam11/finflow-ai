import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload, TokenPair } from '../types/auth.types';
import { User } from '../entities/User';

const parseExpiry = (expiry: string): number => {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] || 60);
};

export const generateTokenPair = (user: User): TokenPair => {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId || 'default',
  };

  const accessToken = jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign({ sub: user.id }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): { sub: string } => {
  return jwt.verify(token, env.jwt.refreshSecret) as { sub: string };
};

export const getRefreshTokenExpiry = (): number => {
  return parseExpiry(env.jwt.refreshExpiresIn);
};
