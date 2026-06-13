import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../../../../../shared/domain/errors.js';
import type { TokenService } from '../../../domain/services/token-service.js';
import type { AuthenticatedLocals } from '../auth-context.js';

export function requireAuth(tokenService: TokenService) {
  return (request: Request, response: Response<unknown, AuthenticatedLocals>, next: NextFunction): void => {
    const authorization = request.header('authorization');
    const token = extractBearerToken(authorization);
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    response.locals.auth = tokenService.verify(token, 'access');
    next();
  };
}

function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}
