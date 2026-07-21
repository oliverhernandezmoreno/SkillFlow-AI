import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { EvaluateOtecReadinessUseCase } from '../../application/use-cases/evaluate-otec-readiness.use-case.js';
import { GetExpiringComplianceItemsUseCase } from '../../application/use-cases/get-expiring-compliance-items.use-case.js';
import { GetOtecComplianceSummaryUseCase } from '../../application/use-cases/get-otec-compliance-summary.use-case.js';
import { ValidateOtecCanPrepareSenceActivityUseCase } from '../../application/use-cases/validate-otec-can-prepare-sence-activity.use-case.js';
import { PrismaOtecReadinessSnapshotAdapter } from './prisma-otec-readiness-snapshot.adapter.js';

const tenantA = '35000000-0000-4000-8000-000000000001';
const tenantB = '35000000-0000-4000-8000-000000000002';
const profileA = '35000000-0000-4000-8000-000000000011';
const profileB = '35000000-0000-4000-8000-000000000012';
const evaluatedAt = new Date('2026-07-17T18:00:00.000Z');
const context = {
  actorUserId: '34000000-0000-4000-8000-000000000003',
  organizationId: tenantA,
  permissions: ['otec_compliance.read', 'otec_compliance.readiness.evaluate'],
};
const enabled = { evaluate: async () => ({ allowed: true as const, reason: 'ENABLED' as const }) };

describe('OTEC compliance query PostgreSQL integration', () => {
  const snapshots = new PrismaOtecReadinessSnapshotAdapter(prismaClient);
  const readiness = new EvaluateOtecReadinessUseCase(snapshots, enabled, () => evaluatedAt);

  beforeAll(async () => {
    await cleanFixtures();
    await seedFixtures();
  });

  afterAll(async () => {
    await cleanFixtures();
    await prismaClient.$disconnect();
  });

  it('projects summary and permits internal preparation from the same consolidated readiness result', async () => {
    const input = { otecProfileId: profileA, evaluationDate: evaluatedAt };
    const summary = await new GetOtecComplianceSummaryUseCase(readiness).execute(input, context);
    const preparation = await new ValidateOtecCanPrepareSenceActivityUseCase(readiness).execute(
      input,
      context,
    );

    expect(summary).toMatchObject({
      organizationId: tenantA,
      otecProfileId: profileA,
      status: 'READY_WITH_WARNINGS',
      warningCount: 1,
      blockingCount: 0,
    });
    expect(preparation).toMatchObject({
      canPrepare: true,
      status: 'READY_WITH_WARNINGS',
      blockingRuleCodes: [],
    });
  });

  it('lists only same-tenant non-deleted exceptional evidence with deterministic pagination', async () => {
    const query = new GetExpiringComplianceItemsUseCase(snapshots, enabled, () => evaluatedAt);
    const first = await query.execute(
      { otecProfileId: profileA, evaluationDate: evaluatedAt },
      { page: 1, pageSize: 3 },
      context,
    );
    const second = await query.execute(
      { otecProfileId: profileA, evaluationDate: evaluatedAt },
      { page: 2, pageSize: 3 },
      context,
    );

    expect(first.meta).toMatchObject({ total: 6, totalPages: 2 });
    expect([...first.data, ...second.data].map((item) => item.entityId)).toEqual([
      '35000000-0000-4000-8000-000000000101',
      '35000000-0000-4000-8000-000000000104',
      '35000000-0000-4000-8000-000000000103',
      '35000000-0000-4000-8000-000000000106',
      '35000000-0000-4000-8000-000000000102',
      '35000000-0000-4000-8000-000000000107',
    ]);
    expect(JSON.stringify([first, second])).not.toContain(tenantB);
    expect(JSON.stringify([first, second])).not.toContain('35000000-0000-4000-8000-000000000199');
  });

  it('does not disclose a foreign profile to summary or expiration queries', async () => {
    await expect(
      new GetOtecComplianceSummaryUseCase(readiness).execute({ otecProfileId: profileB }, context),
    ).rejects.toThrow('The OTEC profile was not found');
    await expect(
      new GetExpiringComplianceItemsUseCase(snapshots, enabled).execute(
        { otecProfileId: profileB },
        { page: 1, pageSize: 10 },
        context,
      ),
    ).rejects.toThrow('The OTEC profile was not found');
  });
});

async function seedFixtures(): Promise<void> {
  await prismaClient.organization.createMany({
    data: [organization(tenantA, '76.350.001-1'), organization(tenantB, '76.350.002-2')],
  });
  await prismaClient.otecProfile.createMany({
    data: [
      { id: profileA, organizationId: tenantA, status: 'ACTIVE' },
      { id: profileB, organizationId: tenantB, status: 'ACTIVE' },
    ],
  });
  await prismaClient.otecComplianceSettings.create({
    data: {
      id: '35000000-0000-4000-8000-000000000090',
      organizationId: tenantA,
      otecProfileId: profileA,
      effectiveFrom: new Date('2026-01-01'),
      sourceVersion: 'query-policy-v1',
      requireNch2728: false,
      requiredResolutionTypes: [],
      qualifyingOfficeTypes: ['HEADQUARTERS'],
      expirationWarningDays: [30],
      undatedRecordTreatment: 'ACCEPTED',
    },
  });
  const current = { validFrom: new Date('2026-01-01'), validUntil: new Date('2027-01-01') };
  await prismaClient.otecAccreditation.createMany({
    data: [
      {
        id: '35000000-0000-4000-8000-000000000100',
        organizationId: tenantA,
        otecProfileId: profileA,
        accreditationType: 'VALID',
        accreditationNumber: 'VALID',
        status: 'ACTIVE',
        ...current,
      },
      {
        id: '35000000-0000-4000-8000-000000000101',
        organizationId: tenantA,
        otecProfileId: profileA,
        accreditationType: 'EXPIRED',
        accreditationNumber: 'EXPIRED',
        status: 'ACTIVE',
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2026-07-16'),
      },
      {
        id: '35000000-0000-4000-8000-000000000198',
        organizationId: tenantB,
        otecProfileId: profileB,
        accreditationType: 'FOREIGN',
        accreditationNumber: 'FOREIGN',
        status: 'ACTIVE',
        validFrom: null,
        validUntil: null,
      },
      {
        id: '35000000-0000-4000-8000-000000000199',
        organizationId: tenantA,
        otecProfileId: profileA,
        accreditationType: 'DELETED',
        accreditationNumber: 'DELETED',
        status: 'ACTIVE',
        deletedAt: evaluatedAt,
        validFrom: null,
        validUntil: null,
      },
    ],
  });
  await prismaClient.qualityCertification.createMany({
    data: [
      {
        id: '35000000-0000-4000-8000-000000000103',
        organizationId: tenantA,
        otecProfileId: profileA,
        certificationType: 'ISO_9001',
        certificationNumber: 'REVOKED',
        certifyingEntity: 'Fictitious',
        status: 'REVOKED',
        ...current,
      },
      {
        id: '35000000-0000-4000-8000-000000000106',
        organizationId: tenantA,
        otecProfileId: profileA,
        certificationType: 'ISO_9001',
        certificationNumber: 'TOMORROW',
        certifyingEntity: 'Fictitious',
        status: 'ACTIVE',
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-07-18'),
      },
    ],
  });
  await prismaClient.otecOffice.createMany({
    data: [
      {
        id: '35000000-0000-4000-8000-000000000102',
        organizationId: tenantA,
        otecProfileId: profileA,
        officeCode: 'HQ',
        name: 'HQ',
        officeType: 'HEADQUARTERS',
        status: 'ACTIVE',
        street: 'Test',
        city: 'Santiago',
        commune: 'Santiago',
        region: 'RM',
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-07-20'),
      },
      {
        id: '35000000-0000-4000-8000-000000000104',
        organizationId: tenantA,
        otecProfileId: profileA,
        officeCode: 'SUSP',
        name: 'Suspended',
        officeType: 'BRANCH',
        status: 'SUSPENDED',
        street: 'Test',
        city: 'Santiago',
        commune: 'Santiago',
        region: 'RM',
        ...current,
      },
    ],
  });
  await prismaClient.legalRepresentative.createMany({
    data: [
      {
        id: '35000000-0000-4000-8000-000000000105',
        organizationId: tenantA,
        otecProfileId: profileA,
        firstName: 'Valid',
        lastName: 'Representative',
        taxId: '111111111',
        roleTitle: 'Representative',
        active: true,
        ...current,
      },
      {
        id: '35000000-0000-4000-8000-000000000107',
        organizationId: tenantA,
        otecProfileId: profileA,
        firstName: 'Undated',
        lastName: 'Representative',
        taxId: '222222222',
        roleTitle: 'Representative',
        active: true,
        validFrom: new Date('2026-01-01'),
        validUntil: null,
      },
    ],
  });
}

function organization(id: string, taxId: string) {
  return {
    id,
    legalName: `Query ${id}`,
    taxId,
    email: `${id}@example.test`,
    type: 'OTEC' as const,
    status: 'ACTIVE' as const,
  };
}

async function cleanFixtures(): Promise<void> {
  const organizations = [tenantA, tenantB];
  await prismaClient.otecResolution.deleteMany({
    where: { organizationId: { in: organizations } },
  });
  await prismaClient.legalRepresentative.deleteMany({
    where: { organizationId: { in: organizations } },
  });
  await prismaClient.otecOffice.deleteMany({ where: { organizationId: { in: organizations } } });
  await prismaClient.qualityCertification.deleteMany({
    where: { organizationId: { in: organizations } },
  });
  await prismaClient.otecAccreditation.deleteMany({
    where: { organizationId: { in: organizations } },
  });
  await prismaClient.otecComplianceSettings.deleteMany({
    where: { organizationId: { in: organizations } },
  });
  await prismaClient.otecProfile.deleteMany({ where: { organizationId: { in: organizations } } });
  await prismaClient.organization.deleteMany({ where: { id: { in: organizations } } });
}
