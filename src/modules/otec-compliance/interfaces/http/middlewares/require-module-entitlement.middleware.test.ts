import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import type { ModuleEntitlementService } from '../../../application/services/module-entitlement.service.js';
import { requireModuleEntitlement } from './require-module-entitlement.middleware.js';

const organizationId = '11111111-1111-4111-8111-111111111111';

describe('requireModuleEntitlement', () => {
  it('continues when the tenant module and feature are enabled', async () => {
    const service = createService({ allowed: true, reason: 'ENABLED' });
    const next = vi.fn();

    await requireModuleEntitlement(service, 'readiness')(
      {} as Request,
      createResponse({ organizationId }),
      next,
    );

    expect(service.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId, feature: 'readiness' }),
    );
    expect(next).toHaveBeenCalledWith();
  });

  it('returns authentication error through next when tenant context is missing', async () => {
    const service = createService({ allowed: true, reason: 'ENABLED' });
    const next = vi.fn();

    await requireModuleEntitlement(service)({} as Request, createResponse(undefined), next);

    expect(service.evaluate).not.toHaveBeenCalled();
    expect(next.mock.calls[0]?.[0]).toMatchObject({ code: 'UNAUTHORIZED', statusCode: 401 });
  });

  it('returns a safe module-unavailable error through next when access is denied', async () => {
    const service = createService({ allowed: false, reason: 'SUSPENDED' });
    const next = vi.fn();

    await requireModuleEntitlement(service)(
      {} as Request,
      createResponse({ organizationId }),
      next,
    );

    expect(next.mock.calls[0]?.[0]).toMatchObject({
      code: 'MODULE_UNAVAILABLE',
      statusCode: 403,
      message: 'OTEC Compliance module is unavailable',
    });
  });
});

function createService(
  decision: { allowed: true; reason: 'ENABLED' } | { allowed: false; reason: 'SUSPENDED' },
) {
  return {
    evaluate: vi.fn().mockResolvedValue(decision),
  } as unknown as ModuleEntitlementService;
}

function createResponse(auth: { organizationId: string } | undefined): Response {
  return {
    locals: auth
      ? {
          auth: {
            userId: '44444444-4444-4444-8444-444444444444',
            organizationId: auth.organizationId,
            email: 'operator@example.test',
            permissions: [],
          },
        }
      : {},
  } as unknown as Response;
}
