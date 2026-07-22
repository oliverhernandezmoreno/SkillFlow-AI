import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError, UnauthorizedError } from '../../../../../shared/domain/errors.js';
import type { AuthenticatedLocals } from '../auth-context.js';

export function requirePermission(permissionCode: string) {
  return (request: Request, response: Response<unknown, AuthenticatedLocals>, next: NextFunction): void => {
    const auth = response.locals.auth;
    if (!auth) {
      throw new UnauthorizedError('Authentication required');
    }

    const permissionPresent = auth.permissions.includes(permissionCode);
    const temporalClaims = auth as typeof auth & {
      iat?: number;
      exp?: number;
    };
    request.log.warn(
      {
        marker: 'AUTH_PERMISSION_DIAGNOSTIC',
        requiredPermission: permissionCode,
        permissionPresent,
        permissionCount: auth.permissions.length,
        otecPermissions: auth.permissions.filter((code) => code.startsWith('otec_compliance.')),
        actorUserId: auth.userId,
        organizationId: auth.organizationId,
        tokenIssuedAt: temporalClaims.iat,
        tokenExpiresAt: temporalClaims.exp,
      },
      permissionPresent
        ? 'AUTH_PERMISSION_DIAGNOSTIC permission granted'
        : 'AUTH_PERMISSION_DIAGNOSTIC permission denied',
    );

    if (!permissionPresent) {
      throw new ForbiddenError('Permission denied');
    }

    next();
  };
}
