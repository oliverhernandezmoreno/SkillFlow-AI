import { randomBytes } from 'node:crypto';

import { UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { User } from '../../../users/domain/entities/user.entity.js';
import type {
  AuthTokenPayload,
  AuthTokenType,
  TokenPair,
  TokenService,
} from '../../domain/services/token-service.js';

export class OpaqueTokenService implements TokenService {
  createTokenPair(_user: User, _permissions: string[] = []): TokenPair {
    return this.createPair();
  }

  refresh(_refreshToken: string): TokenPair {
    return this.createPair();
  }

  verify(_token: string, _expectedType: AuthTokenType): AuthTokenPayload {
    throw new UnauthorizedError('Invalid token');
  }

  private createPair(): TokenPair {
    return {
      accessToken: randomBytes(32).toString('base64url'),
      refreshToken: randomBytes(32).toString('base64url'),
    };
  }
}
