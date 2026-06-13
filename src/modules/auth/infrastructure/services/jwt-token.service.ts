import jwt from 'jsonwebtoken';

import { UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { User } from '../../../users/domain/entities/user.entity.js';
import type {
  AuthTokenPayload,
  AuthTokenType,
  TokenPair,
  TokenService,
} from '../../domain/services/token-service.js';

type TokenExpiresIn = NonNullable<jwt.SignOptions['expiresIn']>;

interface JwtTokenServiceConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiresIn: TokenExpiresIn;
  refreshTokenExpiresIn: TokenExpiresIn;
}

interface JwtClaims extends jwt.JwtPayload {
  sub: string;
  organizationId: string;
  roleIds: string[];
  permissions: string[];
  type: AuthTokenType;
}

const defaultJwtConfig: JwtTokenServiceConfig = {
  accessTokenSecret: process.env['JWT_ACCESS_SECRET'] ?? 'development-access-token-secret',
  refreshTokenSecret: process.env['JWT_REFRESH_SECRET'] ?? 'development-refresh-token-secret',
  accessTokenExpiresIn: getTokenExpiresIn(process.env['JWT_ACCESS_EXPIRES_IN'], '15m'),
  refreshTokenExpiresIn: getTokenExpiresIn(process.env['JWT_REFRESH_EXPIRES_IN'], '7d'),
};

function getTokenExpiresIn(value: string | undefined, fallback: TokenExpiresIn): TokenExpiresIn {
  return (value ?? fallback) as TokenExpiresIn;
}

export class JwtTokenService implements TokenService {
  constructor(private readonly config: JwtTokenServiceConfig = defaultJwtConfig) {}

  createTokenPair(user: User, permissions: string[] = []): TokenPair {
    const props = user.toPrimitives();
    const payload = {
      organizationId: props.organizationId,
      roleIds: props.roleIds,
      permissions,
    };

    return {
      accessToken: jwt.sign(
        { ...payload, type: 'access' },
        this.config.accessTokenSecret,
        {
          subject: props.id,
          expiresIn: this.config.accessTokenExpiresIn,
        },
      ),
      refreshToken: jwt.sign(
        { ...payload, type: 'refresh' },
        this.config.refreshTokenSecret,
        {
          subject: props.id,
          expiresIn: this.config.refreshTokenExpiresIn,
        },
      ),
    };
  }

  refresh(refreshToken: string): TokenPair {
    const payload = this.verify(refreshToken, 'refresh');
    const user = {
      toPrimitives: () => ({
        id: payload.userId,
        organizationId: payload.organizationId,
        roleIds: payload.roleIds,
      }),
    } as User;

    return this.createTokenPair(user, payload.permissions);
  }

  verify(token: string, expectedType: AuthTokenType): AuthTokenPayload {
    const secret =
      expectedType === 'access' ? this.config.accessTokenSecret : this.config.refreshTokenSecret;

    try {
      const decoded = jwt.verify(token, secret);
      if (!this.isJwtClaims(decoded) || decoded.type !== expectedType) {
        throw new UnauthorizedError('Invalid token');
      }

      return {
        userId: decoded.sub,
        organizationId: decoded.organizationId,
        roleIds: decoded.roleIds,
        permissions: decoded.permissions,
        type: decoded.type,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      throw new UnauthorizedError('Invalid token');
    }
  }

  private isJwtClaims(decoded: string | jwt.JwtPayload): decoded is JwtClaims {
    if (typeof decoded === 'string') {
      return false;
    }

    return (
      typeof decoded.sub === 'string' &&
      typeof decoded['organizationId'] === 'string' &&
      Array.isArray(decoded['roleIds']) &&
      decoded['roleIds'].every((roleId) => typeof roleId === 'string') &&
      Array.isArray(decoded['permissions']) &&
      decoded['permissions'].every((permission) => typeof permission === 'string') &&
      (decoded['type'] === 'access' || decoded['type'] === 'refresh')
    );
  }
}
