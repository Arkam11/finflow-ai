import { generateTokenPair, verifyAccessToken, verifyRefreshToken } from '../utils/jwt';
import { UserRole } from '../types/auth.types';
import { User } from '../entities/User';

const mockUser = (): User => {
  const user = new User();
  user.id = 'test-uuid-1234';
  user.email = 'test@finflow.com';
  user.displayName = 'Test User';
  user.role = UserRole.BANK_CUSTOMER;
  user.tenantId = 'tenant-001';
  user.isActive = true;
  user.provider = 'google';
  user.createdAt = new Date();
  user.updatedAt = new Date();
  return user;
};

describe('JWT Utilities', () => {
  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', () => {
      const user = mockUser();
      const tokens = generateTokenPair(user);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate different tokens for different users', () => {
      const user1 = mockUser();
      const user2 = mockUser();
      user2.id = 'different-uuid-5678';
      user2.email = 'other@finflow.com';

      const tokens1 = generateTokenPair(user1);
      const tokens2 = generateTokenPair(user2);

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token and return correct payload', () => {
      const user = mockUser();
      const { accessToken } = generateTokenPair(user);
      const payload = verifyAccessToken(accessToken);

      expect(payload.sub).toBe(user.id);
      expect(payload.email).toBe(user.email);
      expect(payload.role).toBe(UserRole.BANK_CUSTOMER);
      expect(payload.tenantId).toBe('tenant-001');
    });

    it('should throw on invalid access token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow();
    });

    it('should throw on tampered token', () => {
      const user = mockUser();
      const { accessToken } = generateTokenPair(user);
      const tampered = accessToken.slice(0, -5) + 'XXXXX';
      expect(() => verifyAccessToken(tampered)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const user = mockUser();
      const { refreshToken } = generateTokenPair(user);
      const payload = verifyRefreshToken(refreshToken);

      expect(payload.sub).toBe(user.id);
    });

    it('should throw on invalid refresh token', () => {
      expect(() => verifyRefreshToken('bad.refresh.token')).toThrow();
    });
  });
});

describe('UserRole enum', () => {
  it('should have correct role values', () => {
    expect(UserRole.BANK_CUSTOMER).toBe('BANK_CUSTOMER');
    expect(UserRole.MERCHANT).toBe('MERCHANT');
    expect(UserRole.ADMIN).toBe('ADMIN');
  });
});
