import { describe, expect, it } from 'vitest';

import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import {
  BadRequestError,
  ModuleUnavailableError,
  NotFoundError,
} from '../../../../shared/domain/errors.js';
import type { OtecReadinessSnapshot } from '../../domain/services/otec-readiness-evaluator.js';
import type { OtecReadinessSnapshotReadPort } from '../ports/otec-readiness-snapshot-read.port.js';
import { EvaluateOtecReadinessUseCase } from './evaluate-otec-readiness.use-case.js';
import { GetExpiringComplianceItemsUseCase } from './get-expiring-compliance-items.use-case.js';
import { GetOtecComplianceSummaryUseCase } from './get-otec-compliance-summary.use-case.js';
import { ValidateOtecCanPrepareSenceActivityUseCase } from './validate-otec-can-prepare-sence-activity.use-case.js';

const organizationId = '34000000-0000-4000-8000-000000000001';
const profileId = '34000000-0000-4000-8000-000000000002';
const evaluatedAt = new Date('2026-07-17T18:00:00.000Z');
const context: UseCaseContext = {
  actorUserId: '34000000-0000-4000-8000-000000000002',
  organizationId,
  permissions: ['otec_compliance.read', 'otec_compliance.readiness.evaluate'],
};
const enabled = { evaluate: async () => ({ allowed: true as const, reason: 'ENABLED' as const }) };

describe('OTEC compliance query use cases', () => {
  it('projects a compact summary from the consolidated readiness result', async () => {
    const summary = await summaryUseCase(readySnapshot({ expiring: true })).execute(
      { otecProfileId: profileId, evaluationDate: evaluatedAt },
      context,
    );
    expect(summary).toEqual({
      organizationId,
      otecProfileId: profileId,
      status: 'READY_WITH_WARNINGS',
      evaluatedAt,
      policyVersion: 'policy-v1',
      blockingCount: 0,
      warningCount: 5,
      passedRuleCount: 2,
      missingItemCount: 0,
      expiringItemCount: 5,
      metadata: { basis: 'INTERNAL_CONFIGURED_RECORDS', officialValidation: false },
    });
  });

  it.each([
    [readySnapshot(), true, []],
    [readySnapshot({ expiring: true }), true, []],
    [readySnapshot({ missingOffice: true }), false, ['OTEC-OFF-001']],
  ] as const)(
    'validates internal activity preparation from readiness',
    async (snapshot, allowed, codes) => {
      const result = await activityUseCase(snapshot).execute(
        { otecProfileId: profileId, evaluationDate: evaluatedAt },
        context,
      );
      expect(result.canPrepare).toBe(allowed);
      expect(result.blockingRuleCodes).toEqual(codes);
      expect(result.metadata).toEqual({
        purpose: 'INTERNAL_ACTIVITY_PREPARATION',
        officialValidation: false,
      });
    },
  );

  it('lists exceptional items with filters, deterministic order, and pagination', async () => {
    const useCase = expirationUseCase(expirationSnapshot());
    const firstPage = await useCase.execute(
      {
        otecProfileId: profileId,
        evaluationDate: evaluatedAt,
        states: ['EXPIRED', 'EXPIRING_SOON', 'UNDATED', 'SUSPENDED', 'REVOKED'],
      },
      { page: 1, pageSize: 3 },
      context,
    );
    expect(firstPage.meta).toEqual({ page: 1, pageSize: 3, total: 6, totalPages: 2 });
    expect(firstPage.data.map((item) => [item.state, item.entityType, item.entityId])).toEqual([
      ['EXPIRED', 'OTEC_ACCREDITATION', 'expired-accreditation'],
      ['SUSPENDED', 'OTEC_OFFICE', 'suspended-office'],
      ['REVOKED', 'QUALITY_CERTIFICATION', 'revoked-certification'],
    ]);
    const secondPage = await useCase.execute(
      { otecProfileId: profileId, evaluationDate: evaluatedAt },
      { page: 2, pageSize: 3 },
      context,
    );
    expect(secondPage.data.map((item) => item.entityId)).toEqual([
      'expires-today',
      'expires-tomorrow',
      'undated-representative',
    ]);
  });

  it('supports a configured/custom window without a second hardcoded threshold', async () => {
    const result = await expirationUseCase(expirationSnapshot()).execute(
      {
        otecProfileId: profileId,
        evaluationDate: evaluatedAt,
        expiringWithinDays: 0,
        states: ['EXPIRING_SOON'],
      },
      { page: 1, pageSize: 10 },
      context,
    );
    expect(result.data.map((item) => item.entityId)).toEqual(['expires-today']);
  });

  it('uses the injected clock and tenant context, and rejects invalid windows', async () => {
    const port = new FakeSnapshotPort(expirationSnapshot());
    const useCase = new GetExpiringComplianceItemsUseCase(port, enabled, () => evaluatedAt);
    await useCase.execute({ otecProfileId: profileId }, { page: 1, pageSize: 10 }, context);
    expect(port.lastInput).toEqual({ organizationId, otecProfileId: profileId, evaluatedAt });
    await expect(
      useCase.execute(
        { otecProfileId: profileId, expiringWithinDays: -1 },
        { page: 1, pageSize: 10 },
        context,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('checks entitlement before snapshot reads and safely hides foreign profiles', async () => {
    const port = new FakeSnapshotPort(expirationSnapshot());
    const disabled = new GetExpiringComplianceItemsUseCase(
      port,
      { evaluate: async () => ({ allowed: false as const, reason: 'DISABLED' as const }) },
      () => evaluatedAt,
    );
    await expect(
      disabled.execute({ otecProfileId: profileId }, { page: 1, pageSize: 10 }, context),
    ).rejects.toBeInstanceOf(ModuleUnavailableError);
    expect(port.lastInput).toBeNull();
    await expect(
      expirationUseCase(null).execute(
        { otecProfileId: 'foreign-profile' },
        { page: 1, pageSize: 10 },
        context,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns an empty deterministic page when no exceptional evidence exists', async () => {
    const result = await expirationUseCase(readySnapshot()).execute(
      { otecProfileId: profileId, evaluationDate: evaluatedAt },
      { page: 1, pageSize: 10 },
      context,
    );
    expect(result).toMatchObject({ data: [], meta: { total: 0, totalPages: 0 } });
  });
});

class FakeSnapshotPort implements OtecReadinessSnapshotReadPort {
  lastInput: { organizationId: string; otecProfileId: string; evaluatedAt: Date } | null = null;
  constructor(private readonly snapshot: OtecReadinessSnapshot | null) {}
  async load(input: { organizationId: string; otecProfileId: string; evaluatedAt: Date }) {
    this.lastInput = input;
    return this.snapshot;
  }
}

function evaluateUseCase(snapshot: OtecReadinessSnapshot) {
  return new EvaluateOtecReadinessUseCase(
    new FakeSnapshotPort(snapshot),
    enabled,
    () => evaluatedAt,
  );
}
function summaryUseCase(snapshot: OtecReadinessSnapshot) {
  return new GetOtecComplianceSummaryUseCase(evaluateUseCase(snapshot));
}
function activityUseCase(snapshot: OtecReadinessSnapshot) {
  return new ValidateOtecCanPrepareSenceActivityUseCase(evaluateUseCase(snapshot));
}
function expirationUseCase(snapshot: OtecReadinessSnapshot | null) {
  return new GetExpiringComplianceItemsUseCase(
    new FakeSnapshotPort(snapshot),
    enabled,
    () => evaluatedAt,
  );
}

function readySnapshot(
  options: { expiring?: boolean; missingOffice?: boolean } = {},
): OtecReadinessSnapshot {
  const current = (id: string) => ({
    id,
    status: 'ACTIVE',
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validUntil: options.expiring
      ? new Date('2026-07-20T00:00:00.000Z')
      : new Date('2027-01-01T00:00:00.000Z'),
  });
  return {
    organization: { id: organizationId, type: 'OTEC', status: 'ACTIVE' },
    profile: { id: profileId, status: 'ACTIVE' },
    settings: {
      policyVersion: 'policy-v1',
      requireNch2728: true,
      requiredResolutionTypes: ['AUTHORIZATION'],
      qualifyingOfficeTypes: ['HEADQUARTERS'],
      expirationWarningDays: [30],
      undatedRecordTreatment: 'ACCEPTED',
    },
    accreditations: [current('accreditation')],
    certifications: [{ ...current('certification'), certificationType: 'NCH_2728' }],
    offices: options.missingOffice ? [] : [{ ...current('office'), officeType: 'HEADQUARTERS' }],
    representatives: [{ ...current('representative'), active: true }],
    resolutions: [{ ...current('resolution'), resolutionType: 'AUTHORIZATION', superseded: false }],
  };
}

function expirationSnapshot(): OtecReadinessSnapshot {
  const snapshot = readySnapshot();
  snapshot.accreditations = [
    {
      id: 'expired-accreditation',
      status: 'ACTIVE',
      validFrom: new Date('2025-01-01'),
      validUntil: new Date('2026-07-16'),
    },
    {
      id: 'ignored-inactive',
      status: 'INACTIVE',
      validFrom: null,
      validUntil: new Date('2026-07-17'),
    },
  ];
  snapshot.certifications = [
    {
      id: 'revoked-certification',
      status: 'REVOKED',
      validFrom: new Date('2025-01-01'),
      validUntil: new Date('2026-08-01'),
      certificationType: 'NCH_2728',
    },
    {
      id: 'expires-tomorrow',
      status: 'ACTIVE',
      validFrom: new Date('2025-01-01'),
      validUntil: new Date('2026-07-18'),
      certificationType: 'ISO_9001',
    },
  ];
  snapshot.offices = [
    {
      id: 'suspended-office',
      status: 'SUSPENDED',
      validFrom: null,
      validUntil: new Date('2026-09-01'),
      officeType: 'HEADQUARTERS',
    },
  ];
  snapshot.representatives = [
    {
      id: 'undated-representative',
      status: 'ACTIVE',
      active: true,
      validFrom: new Date('2025-01-01'),
      validUntil: null,
    },
  ];
  snapshot.resolutions = [
    {
      id: 'expires-today',
      status: 'ACTIVE',
      validFrom: new Date('2025-01-01'),
      validUntil: new Date('2026-07-17'),
      resolutionType: 'AUTHORIZATION',
      superseded: false,
    },
    {
      id: 'ignored-superseded',
      status: 'SUPERSEDED',
      validFrom: null,
      validUntil: new Date('2026-07-17'),
      resolutionType: 'AUTHORIZATION',
      superseded: true,
    },
  ];
  return snapshot;
}
