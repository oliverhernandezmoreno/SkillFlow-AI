import { describe, expect, it } from 'vitest';

import { ModuleEntitlement } from '../../domain/entities/module-entitlement.entity.js';
import type { ModuleEntitlementRepository } from '../../domain/repositories/module-entitlement.repository.js';
import { ModuleEntitlementService } from './module-entitlement.service.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const evaluatedAt = new Date('2026-07-16T12:00:00.000Z');

describe('ModuleEntitlementService', () => {
  it('returns unavailable when the tenant has no module entitlement', async () => {
    const service = new ModuleEntitlementService(new InMemoryModuleEntitlementRepository(null));

    await expect(service.evaluate({ organizationId, evaluatedAt })).resolves.toEqual({
      allowed: false,
      reason: 'UNAVAILABLE',
    });
  });

  it('allows an enabled feature', async () => {
    const service = new ModuleEntitlementService(
      new InMemoryModuleEntitlementRepository(createEntitlement(['readiness'])),
    );

    await expect(
      service.evaluate({ organizationId, evaluatedAt, feature: 'readiness' }),
    ).resolves.toEqual({
      allowed: true,
      reason: 'ENABLED',
    });
  });

  it('denies a feature that is not enabled', async () => {
    const service = new ModuleEntitlementService(
      new InMemoryModuleEntitlementRepository(createEntitlement(['profile'])),
    );

    await expect(
      service.evaluate({ organizationId, evaluatedAt, feature: 'readiness' }),
    ).resolves.toEqual({
      allowed: false,
      reason: 'FEATURE_DISABLED',
    });
  });
});

class InMemoryModuleEntitlementRepository implements ModuleEntitlementRepository {
  constructor(private readonly entitlement: ModuleEntitlement | null) {}

  async findByModuleCode(input: {
    organizationId: string;
    moduleCode: 'OTEC_COMPLIANCE';
  }): Promise<ModuleEntitlement | null> {
    const props = this.entitlement?.toPrimitives();
    return props?.organizationId === input.organizationId ? this.entitlement : null;
  }
}

function createEntitlement(enabledFeatures: string[]): ModuleEntitlement {
  return ModuleEntitlement.rehydrate({
    id: '33333333-3333-4333-8333-333333333333',
    organizationId,
    moduleCode: 'OTEC_COMPLIANCE',
    status: 'ENABLED',
    enabledFeatures,
    validFrom: null,
    validUntil: null,
    restrictionReason: null,
    createdAt: evaluatedAt,
    updatedAt: evaluatedAt,
    deletedAt: null,
    version: 1,
  });
}
