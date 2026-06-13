import type { User } from '../../../users/domain/entities/user.entity.js';

export type AuthTokenType = 'access' | 'refresh';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthTokenPayload {
  userId: string;
  organizationId: string;
  roleIds: string[];
  permissions: string[];
  type: AuthTokenType;
}

export interface TokenService {
  createTokenPair(user: User, permissions?: string[]): TokenPair;
  refresh(refreshToken: string): TokenPair;
  verify(token: string, expectedType: AuthTokenType): AuthTokenPayload;
}
