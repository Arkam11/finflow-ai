import { Request, Response } from 'express';
import { refreshTokens, revokeUserSession } from '../services/auth.service';
import { logger } from '../config/logger';

export const handleRefreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token required' });
      return;
    }
    const tokens = await refreshTokens(refreshToken);
    res.json({ success: true, data: tokens, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Token refresh failed', { error });
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }
};

export const handleLogout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (userId) await revokeUserSession(userId);
    res.json({ success: true, data: null, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Logout failed', { error });
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
};

export const handleGetProfile = async (req: Request, res: Response): Promise<void> => {
  const user = (req as Request & { user?: Record<string, unknown> }).user;
  res.json({ success: true, data: user, timestamp: new Date().toISOString() });
};

export const handleHealthCheck = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: { status: 'healthy', service: 'auth-service' },
    timestamp: new Date().toISOString(),
  });
};
