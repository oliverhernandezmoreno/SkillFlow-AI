import { describe, expect, it } from 'vitest';

import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import { ForbiddenError, ModuleUnavailableError } from '../../../../shared/domain/errors.js';
import type { ModuleAccessDecision } from '../../domain/entities/module-entitlement.entity.js';
import { OtecComplianceAuthorizationPolicy } from './otec-compliance-authorization.policy.js';

const context: UseCaseContext = {
  actorUserId: '10000000-0000-4000-8000-000000000001',
  organizationId: '10000000-0000-4000-8000-000000000002',
  permissions: ['otec_compliance.read'],
};

describe('OtecComplianceAuthorizationPolicy', () => {
  it('allows the declared feature and permission using the authenticated tenant', async () => {
    const access = new StubAccess({ allowed: true, reason: 'ENABLED' });
    const policy = new OtecComplianceAuthorizationPolicy(access);

    await expect(
      policy.authorize(context, {
        feature: 'profile',
        permission: 'otec_compliance.read',
        evaluatedAt: new Date('2026-07-17T00:00:00.000Z'),
      }),
    ).resolves.toBe(context.organizationId);
    expect(access.organizationId).toBe(context.organizationId);
  });

  it('rejects a missing permission after entitlement succeeds', async () => {
    const policy = new OtecComplianceAuthorizationPolicy(
      new StubAccess({ allowed: true, reason: 'ENABLED' }),
    );
    await expect(
      policy.authorize(context, {
        feature: 'profile',
        permission: 'otec_compliance.profile.manage',
        evaluatedAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejects an unavailable entitlement even when permission is present', async () => {
    const policy = new OtecComplianceAuthorizationPolicy(
      new StubAccess({ allowed: false, reason: 'UNAVAILABLE' }),
    );
    await expect(
      policy.authorize(
        { ...context, permissions: ['otec_compliance.profile.manage'] },
        {
          feature: 'profile',
          permission: 'otec_compliance.profile.manage',
          evaluatedAt: new Date(),
        },
      ),
    ).rejects.toBeInstanceOf(ModuleUnavailableError);
  });
});

class StubAccess {
  organizationId: string | null = null;
  constructor(private readonly decision: ModuleAccessDecision) {}
  async evaluate(input: { organizationId: string }): Promise<ModuleAccessDecision> {
    this.organizationId = input.organizationId;
    return this.decision;
  }
}
