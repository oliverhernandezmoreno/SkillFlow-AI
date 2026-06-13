import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError, UnauthorizedError } from '../../../../../shared/domain/errors.js';
import type { AuthenticatedLocals } from '../auth-context.js';

export function requirePermission(permissionCode: string) {
  return (_request: Request, response: Response<unknown, AuthenticatedLocals>, next: NextFunction): void => {
    const auth = response.locals.auth;
    if (!auth) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!auth.permissions.includes(permissionCode)) {
      throw new ForbiddenError('Permission denied');
    }

    next();
  };
}
