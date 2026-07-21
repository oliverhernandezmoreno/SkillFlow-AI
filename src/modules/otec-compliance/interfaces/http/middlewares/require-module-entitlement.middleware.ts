import type { NextFunction, Request, Response } from 'express';

import type { ModuleAccessDecision } from '../../../domain/entities/module-entitlement.entity.js';
import { ModuleUnavailableError, UnauthorizedError } from '../../../../../shared/domain/errors.js';
import type { AuthenticatedLocals } from '../../../../auth/interfaces/http/auth-context.js';

export function requireModuleEntitlement(
  service: {
    evaluate(input: {
      organizationId: string;
      evaluatedAt: Date;
      moduleCode?: 'OTEC_COMPLIANCE';
      feature?: string;
    }): Promise<ModuleAccessDecision>;
  },
  feature?: string,
): (
  request: Request,
  response: Response<unknown, AuthenticatedLocals>,
  next: NextFunction,
) => Promise<void> {
  return async (_request, response, next): Promise<void> => {
    try {
      const auth = response.locals.auth;
      if (!auth) {
        throw new UnauthorizedError('Authentication required');
      }

      const decision = await service.evaluate({
        organizationId: auth.organizationId,
        evaluatedAt: new Date(),
        ...(feature ? { feature } : {}),
      });
      if (!decision.allowed) {
        throw new ModuleUnavailableError('OTEC Compliance module is unavailable');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
