import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import { requireOtecPermission } from '../use-cases/otec-profile-use-case.helpers.js';
import { otecAuthorizationDiagnosticLogger } from './otec-authorization-diagnostic.logger.js';
import {
  OtecComplianceAuthorizationPolicy,
  otecCompliancePermissions,
} from './otec-compliance-authorization.policy.js';

const context: UseCaseContext = {
  actorUserId: '10000000-0000-4000-8000-000000000001',
  organizationId: '10000000-0000-4000-8000-000000000002',
  permissions: ['otec_compliance.read'],
};

describe('OTEC authorization diagnostics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logs policy diagnostics only when permission authorization rejects', async () => {
    const warn = vi.spyOn(otecAuthorizationDiagnosticLogger, 'warn').mockReturnValue(undefined);
    const policy = new OtecComplianceAuthorizationPolicy({
      evaluate: vi.fn().mockResolvedValue({ allowed: true, reason: 'ENABLED' }),
    });

    await expect(
      policy.authorize(context, {
        feature: 'profile',
        permission: otecCompliancePermissions.profileManage,
        evaluatedAt: new Date('2026-07-22T00:00:00.000Z'),
      }),
    ).rejects.toThrow('Permission denied');

    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({
        marker: 'OTEC_AUTHORIZATION_DIAGNOSTIC',
        source: 'OtecComplianceAuthorizationPolicy.authorize',
        operation: 'authorize:profile',
        requiredPermission: 'otec_compliance.profile.manage',
        permissionPresent: false,
      }),
      'OTEC_AUTHORIZATION_DIAGNOSTIC permission denied',
    );

    warn.mockClear();
    await expect(
      policy.authorize(
        { ...context, permissions: ['otec_compliance.profile.manage'] },
        {
          feature: 'profile',
          permission: otecCompliancePermissions.profileManage,
          evaluatedAt: new Date('2026-07-22T00:00:00.000Z'),
        },
      ),
    ).resolves.toBe(context.organizationId);
    expect(warn).not.toHaveBeenCalled();
  });

  it('logs helper diagnostics only when permission authorization rejects', () => {
    const warn = vi.spyOn(otecAuthorizationDiagnosticLogger, 'warn').mockReturnValue(undefined);

    expect(() => {
      requireOtecPermission(context, otecCompliancePermissions.profileManage);
    }).toThrow('Permission denied');
    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({
        marker: 'OTEC_AUTHORIZATION_DIAGNOSTIC',
        source: 'requireOtecPermission',
        operation: 'requireOtecPermission',
        requiredPermission: 'otec_compliance.profile.manage',
        permissionPresent: false,
      }),
      'OTEC_AUTHORIZATION_DIAGNOSTIC permission denied',
    );

    warn.mockClear();
    expect(() => {
      requireOtecPermission(
        { ...context, permissions: ['otec_compliance.profile.manage'] },
        otecCompliancePermissions.profileManage,
      );
    }).not.toThrow();
    expect(warn).not.toHaveBeenCalled();
  });
});
