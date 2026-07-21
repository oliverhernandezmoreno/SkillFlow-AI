import { describe, expect, it } from 'vitest';

import { ModuleEntitlement } from './module-entitlement.entity.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const otherOrganizationId = '22222222-2222-4222-8222-222222222222';
const evaluationDate = new Date('2026-07-16T12:00:00.000Z');

describe('ModuleEntitlement', () => {
  it('allows an enabled and effective module entitlement', () => {
    const entitlement = createEntitlement({ status: 'ENABLED' });

    expect(entitlement.evaluateAccess({ organizationId, evaluatedAt: evaluationDate })).toEqual({
      allowed: true,
      reason: 'ENABLED',
    });
  });

  it.each([
    ['DISABLED', 'DISABLED'],
    ['SUSPENDED', 'SUSPENDED'],
    ['PLAN_RESTRICTED', 'PLAN_RESTRICTED'],
  ] as const)('denies a %s entitlement', (status, reason) => {
    const entitlement = createEntitlement({ status });

    expect(entitlement.evaluateAccess({ organizationId, evaluatedAt: evaluationDate })).toEqual({
      allowed: false,
      reason,
    });
  });

  it('denies an entitlement whose validity has expired', () => {
    const entitlement = createEntitlement({
      status: 'ENABLED',
      validUntil: new Date('2026-07-15T23:59:59.000Z'),
    });

    expect(entitlement.evaluateAccess({ organizationId, evaluatedAt: evaluationDate })).toEqual({
      allowed: false,
      reason: 'EXPIRED',
    });
  });

  it('denies an entitlement whose validity has not started', () => {
    const entitlement = createEntitlement({
      status: 'ENABLED',
      validFrom: new Date('2026-07-17T00:00:00.000Z'),
    });

    expect(entitlement.evaluateAccess({ organizationId, evaluatedAt: evaluationDate })).toEqual({
      allowed: false,
      reason: 'NOT_EFFECTIVE',
    });
  });

  it('denies cross-tenant evaluation without exposing entitlement details', () => {
    const entitlement = createEntitlement({ status: 'ENABLED' });

    expect(
      entitlement.evaluateAccess({
        organizationId: otherOrganizationId,
        evaluatedAt: evaluationDate,
      }),
    ).toEqual({
      allowed: false,
      reason: 'UNAVAILABLE',
    });
  });

  it('denies a deleted entitlement', () => {
    const entitlement = createEntitlement({
      status: 'ENABLED',
      deletedAt: new Date('2026-07-16T10:00:00.000Z'),
    });

    expect(entitlement.evaluateAccess({ organizationId, evaluatedAt: evaluationDate })).toEqual({
      allowed: false,
      reason: 'UNAVAILABLE',
    });
  });
});

function createEntitlement(
  overrides: Partial<{
    status: 'ENABLED' | 'DISABLED' | 'SUSPENDED' | 'PLAN_RESTRICTED';
    validFrom: Date | null;
    validUntil: Date | null;
    deletedAt: Date | null;
  }>,
): ModuleEntitlement {
  return ModuleEntitlement.rehydrate({
    id: '33333333-3333-4333-8333-333333333333',
    organizationId,
    moduleCode: 'OTEC_COMPLIANCE',
    status: overrides.status ?? 'ENABLED',
    enabledFeatures: [],
    validFrom: overrides.validFrom ?? null,
    validUntil: overrides.validUntil ?? null,
    restrictionReason: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: overrides.deletedAt ?? null,
    version: 1,
  });
}
