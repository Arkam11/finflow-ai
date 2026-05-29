export enum UserRole {
  BANK_CUSTOMER = 'BANK_CUSTOMER',
  MERCHANT = 'MERCHANT',
  ADMIN = 'ADMIN',
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string;
  iat?: number;
  exp?: number;
}

export interface OAuthProfile {
  providerId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  provider: 'google' | 'github';
}
