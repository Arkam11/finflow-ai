import { Router, Request, Response } from 'express';
import passport from 'passport';
import {
  handleRefreshToken,
  handleLogout,
  handleGetProfile,
  handleHealthCheck,
} from '../controllers/auth.controller';
import { issueTokens } from '../services/auth.service';
import { User } from '../entities/User';
import { env } from '../config/env';

const router = Router();

router.get('/health', handleHealthCheck);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/failed' }),
  async (req: Request, res: Response) => {
    const tokens = await issueTokens(req.user as User);
    res.redirect(
      `${env.clientUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  },
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/auth/failed' }),
  async (req: Request, res: Response) => {
    const tokens = await issueTokens(req.user as User);
    res.redirect(
      `${env.clientUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  },
);

router.post('/refresh', handleRefreshToken);

router.post('/logout', passport.authenticate('jwt', { session: false }), handleLogout);

router.get('/profile', passport.authenticate('jwt', { session: false }), handleGetProfile);

router.get('/failed', (_req: Request, res: Response) => {
  res.status(401).json({ success: false, error: 'OAuth authentication failed' });
});

export default router;
