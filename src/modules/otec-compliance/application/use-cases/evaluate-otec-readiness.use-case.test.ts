import { describe, expect, it } from 'vitest';

import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import { ModuleUnavailableError, NotFoundError } from '../../../../shared/domain/errors.js';
import type { OtecReadinessSnapshot } from '../../domain/services/otec-readiness-evaluator.js';
import type { OtecReadinessSnapshotReadPort } from '../ports/otec-readiness-snapshot-read.port.js';
import { EvaluateOtecReadinessUseCase } from './evaluate-otec-readiness.use-case.js';

const organizationId = '32000000-0000-4000-8000-000000000001';
const profileId = '32000000-0000-4000-8000-000000000002';
const explicitDate = new Date('2026-07-17T12:00:00.000Z');
const clockDate = new Date('2026-07-18T12:00:00.000Z');
const context: UseCaseContext = {
  actorUserId: '32000000-0000-4000-8000-000000000002',
  organizationId,
  permissions: ['otec_compliance.read', 'otec_compliance.readiness.evaluate'],
};

describe('EvaluateOtecReadinessUseCase', () => {
  it.each([
    ['READY', readySnapshot()],
    ['READY_WITH_WARNINGS', readySnapshot({ expiring: true })],
    ['NOT_READY', readySnapshot({ missingOffice: true })],
  ] as const)('returns %s from a tenant-scoped snapshot', async (status, snapshot) => {
    const port = new FakeSnapshotPort(snapshot);
    const result = await createUseCase(port).execute(
      { otecProfileId: profileId, evaluationDate: explicitDate },
      context,
    );
    expect(result.status).toBe(status);
    expect(port.lastInput).toEqual({
      organizationId,
      otecProfileId: profileId,
      evaluatedAt: explicitDate,
    });
  });

  it('uses an explicit evaluation date instead of the injected clock', async () => {
    const result = await createUseCase(new FakeSnapshotPort(readySnapshot())).execute(
      { otecProfileId: profileId, evaluationDate: explicitDate },
      context,
    );
    expect(result.evaluatedAt).toEqual(explicitDate);
  });

  it('uses the injected clock when evaluationDate is omitted', async () => {
    const port = new FakeSnapshotPort(readySnapshot());
    const result = await createUseCase(port).execute({ otecProfileId: profileId }, context);
    expect(result.evaluatedAt).toEqual(clockDate);
    expect(port.lastInput?.evaluatedAt).toEqual(clockDate);
  });

  it('rejects a missing authenticated tenant', async () => {
    await expect(
      createUseCase(new FakeSnapshotPort(readySnapshot())).execute(
        { otecProfileId: profileId },
        { actorUserId: null, organizationId: null },
      ),
    ).rejects.toThrow('An authenticated tenant is required');
  });

  it('checks readiness entitlement before loading the snapshot', async () => {
    const port = new FakeSnapshotPort(readySnapshot());
    await expect(
      createUseCase(port, false).execute({ otecProfileId: profileId }, context),
    ).rejects.toBeInstanceOf(ModuleUnavailableError);
    expect(port.lastInput).toBeNull();
  });

  it('does not disclose missing or cross-tenant profiles', async () => {
    const port = new FakeSnapshotPort(null);
    await expect(
      createUseCase(port).execute({ otecProfileId: 'foreign-profile' }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('is read-only and deterministic for identical inputs', async () => {
    const port = new FakeSnapshotPort(readySnapshot());
    const useCase = createUseCase(port);
    const first = await useCase.execute(
      { otecProfileId: profileId, evaluationDate: explicitDate },
      context,
    );
    const second = await useCase.execute(
      { otecProfileId: profileId, evaluationDate: explicitDate },
      context,
    );
    expect(second).toEqual(first);
    expect(port.loadCount).toBe(2);
  });
});

class FakeSnapshotPort implements OtecReadinessSnapshotReadPort {
  lastInput: { organizationId: string; otecProfileId: string; evaluatedAt: Date } | null = null;
  loadCount = 0;

  constructor(private readonly snapshot: OtecReadinessSnapshot | null) {}

  async load(input: { organizationId: string; otecProfileId: string; evaluatedAt: Date }) {
    this.lastInput = input;
    this.loadCount += 1;
    return this.snapshot;
  }
}

function createUseCase(port: OtecReadinessSnapshotReadPort, allowed = true) {
  return new EvaluateOtecReadinessUseCase(
    port,
    {
      evaluate: async () =>
        allowed
          ? { allowed: true as const }
          : { allowed: false as const, reason: 'DISABLED' as const },
    },
    () => clockDate,
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
      ? new Date('2026-07-25T12:00:00.000Z')
      : new Date('2027-01-01T00:00:00.000Z'),
  });
  return {
    organization: { id: organizationId, type: 'OTEC', status: 'ACTIVE' },
    profile: { id: profileId, status: 'ACTIVE' },
    settings: {
      policyVersion: 'policy-v1',
      requireNch2728: false,
      requiredResolutionTypes: [],
      qualifyingOfficeTypes: ['HEADQUARTERS'],
      expirationWarningDays: [30],
      undatedRecordTreatment: 'ACCEPTED',
    },
    accreditations: [current('accreditation')],
    certifications: [],
    offices: options.missingOffice ? [] : [{ ...current('office'), officeType: 'HEADQUARTERS' }],
    representatives: [{ ...current('representative'), active: true }],
    resolutions: [],
  };
}
