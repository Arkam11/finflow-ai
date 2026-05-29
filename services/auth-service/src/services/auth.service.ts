import { AppDataSource } from '../config/database';
import { storeRefreshToken, deleteRefreshToken, getRefreshToken } from '../config/redis';
import { generateTokenPair, verifyRefreshToken, getRefreshTokenExpiry } from '../utils/jwt';
import { User } from '../entities/User';
import { OAuthProfile, TokenPair, UserRole } from '../types/auth.types';
import { logger } from '../config/logger';

const userRepository = () => AppDataSource.getRepository(User);

export const findOrCreateOAuthUser = async (profile: OAuthProfile): Promise<User> => {
  const repo = userRepository();
  const field = profile.provider === 'google' ? 'googleId' : 'githubId';

  let user = await repo.findOne({ where: { [field]: profile.providerId } });

  if (!user) {
    user = await repo.findOne({ where: { email: profile.email } });
    if (user) {
      (user as unknown as Record<string, unknown>)[field] = profile.providerId;
      await repo.save(user);
    }
  }

  if (!user) {
    user = repo.create({
      email: profile.email,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      [field]: profile.providerId,
      provider: profile.provider,
      role: UserRole.BANK_CUSTOMER,
    });
    await repo.save(user);
    logger.info('New OAuth user created', { email: user.email, provider: profile.provider });
  }

  user.lastLoginAt = new Date();
  await repo.save(user);
  return user;
};

export const issueTokens = async (user: User): Promise<TokenPair> => {
  const tokens = generateTokenPair(user);
  await storeRefreshToken(user.id, tokens.refreshToken, getRefreshTokenExpiry());
  return tokens;
};

export const refreshTokens = async (refreshToken: string): Promise<TokenPair> => {
  const payload = verifyRefreshToken(refreshToken);
  const stored = await getRefreshToken(payload.sub);

  if (!stored || stored !== refreshToken) {
    throw new Error('Invalid or expired refresh token');
  }

  const repo = userRepository();
  const user = await repo.findOne({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw new Error('User not found or inactive');

  await deleteRefreshToken(user.id);
  const tokens = generateTokenPair(user);
  await storeRefreshToken(user.id, tokens.refreshToken, getRefreshTokenExpiry());
  return tokens;
};

export const revokeUserSession = async (userId: string): Promise<void> => {
  await deleteRefreshToken(userId);
  logger.info('User session revoked', { userId });
};
