import type { Request, Response } from 'express';

import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import type { AuthenticatedLocals } from './auth-context.js';

export function createUseCaseContext(
  request: Request,
  response: Response<unknown, AuthenticatedLocals>,
): UseCaseContext {
  return {
    actorUserId: response.locals.auth?.userId ?? null,
    organizationId: response.locals.auth?.organizationId ?? null,
    permissions: response.locals.auth?.permissions ?? [],
    correlationId: request.header('x-correlation-id') ?? null,
    ipAddress: request.ip ?? null,
    userAgent: request.header('user-agent') ?? null,
  };
}
