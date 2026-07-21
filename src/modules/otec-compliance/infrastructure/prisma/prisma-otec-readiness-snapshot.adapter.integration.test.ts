import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { PrismaOtecReadinessSnapshotAdapter } from './prisma-otec-readiness-snapshot.adapter.js';

const tenantA = '33000000-0000-4000-8000-000000000001';
const tenantB = '33000000-0000-4000-8000-000000000002';
const profileA = '33000000-0000-4000-8000-000000000011';
const profileB = '33000000-0000-4000-8000-000000000012';
const evaluatedAt = new Date('2026-07-17T12:00:00.000Z');

describe('PrismaOtecReadinessSnapshotAdapter integration', () => {
  const adapter = new PrismaOtecReadinessSnapshotAdapter(prismaClient);

  beforeAll(async () => {
    await cleanFixtures();
    await prismaClient.organization.createMany({
      data: [organization(tenantA, '76.330.001-1'), organization(tenantB, '76.330.002-2')],
    });
    await prismaClient.otecProfile.createMany({
      data: [profile(profileA, tenantA), profile(profileB, tenantB)],
    });
    await seedTenantA();
    await seedForeignAndDeletedEvidence();
  });

  afterAll(async () => {
    await cleanFixtures();
    await prismaClient.$disconnect();
  });

  it('loads one effective tenant/profile snapshot and excludes deleted and foreign evidence', async () => {
    const snapshot = await adapter.load({
      organizationId: tenantA,
      otecProfileId: profileA,
      evaluatedAt,
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.settings).toMatchObject({
      policyVersion: 'current-policy',
      requireNch2728: true,
      requiredResolutionTypes: ['AUTHORIZATION'],
      qualifyingOfficeTypes: ['HEADQUARTERS'],
    });
    expect(snapshot?.accreditations.map((item) => item.id)).toEqual([
      '33000000-0000-4000-8000-000000000101',
    ]);
    expect(snapshot?.certifications).toHaveLength(1);
    expect(snapshot?.offices).toHaveLength(1);
    expect(snapshot?.representatives).toHaveLength(1);
    expect(snapshot?.resolutions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '33000000-0000-4000-8000-000000000105', superseded: true }),
        expect.objectContaining({ id: '33000000-0000-4000-8000-000000000106', superseded: false }),
      ]),
    );
    expect(JSON.stringify(snapshot)).not.toContain(tenantB);
    expect(JSON.stringify(snapshot)).not.toContain('33000000-0000-4000-8000-000000000199');
  });

  it('returns null for a valid profile ID outside the authenticated tenant', async () => {
    await expect(
      adapter.load({ organizationId: tenantA, otecProfileId: profileB, evaluatedAt }),
    ).resolves.toBeNull();
  });
});

async function seedTenantA(): Promise<void> {
  await prismaClient.otecComplianceSettings.createMany({
    data: [
      {
        id: '33000000-0000-4000-8000-000000000091',
        organizationId: tenantA,
        otecProfileId: profileA,
        effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
        effectiveTo: new Date('2025-12-31T23:59:59.999Z'),
        sourceVersion: 'historical-policy',
        requireNch2728: false,
      },
      {
        id: '33000000-0000-4000-8000-000000000092',
        organizationId: tenantA,
        otecProfileId: profileA,
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
        sourceVersion: 'current-policy',
        requireNch2728: true,
        requiredResolutionTypes: ['AUTHORIZATION'],
        qualifyingOfficeTypes: ['HEADQUARTERS'],
        expirationWarningDays: [7, 15, 30],
        undatedRecordTreatment: 'WARNING',
      },
    ],
  });
  const range = {
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validUntil: new Date('2027-01-01T00:00:00.000Z'),
  };
  await prismaClient.otecAccreditation.create({
    data: {
      id: '33000000-0000-4000-8000-000000000101',
      organizationId: tenantA,
      otecProfileId: profileA,
      accreditationType: 'INTERNAL_TEST',
      accreditationNumber: 'ACC-READY',
      status: 'ACTIVE',
      ...range,
    },
  });
  await prismaClient.qualityCertification.create({
    data: {
      id: '33000000-0000-4000-8000-000000000102',
      organizationId: tenantA,
      otecProfileId: profileA,
      certificationType: 'NCH_2728',
      certificationNumber: 'CERT-READY',
      certifyingEntity: 'Fictitious',
      status: 'ACTIVE',
      ...range,
    },
  });
  await prismaClient.otecOffice.create({
    data: {
      id: '33000000-0000-4000-8000-000000000103',
      organizationId: tenantA,
      otecProfileId: profileA,
      officeCode: 'HQ-READY',
      name: 'Fictitious HQ',
      officeType: 'HEADQUARTERS',
      status: 'ACTIVE',
      street: 'Test 1',
      city: 'Santiago',
      commune: 'Santiago',
      region: 'RM',
      ...range,
    },
  });
  await prismaClient.legalRepresentative.create({
    data: {
      id: '33000000-0000-4000-8000-000000000104',
      organizationId: tenantA,
      otecProfileId: profileA,
      firstName: 'Test',
      lastName: 'Representative',
      taxId: '111111111',
      roleTitle: 'Representative',
      active: true,
      ...range,
    },
  });
  await prismaClient.otecResolution.create({
    data: {
      id: '33000000-0000-4000-8000-000000000105',
      organizationId: tenantA,
      otecProfileId: profileA,
      resolutionType: 'AUTHORIZATION',
      resolutionNumber: 'RES-OLD',
      issuingAuthority: 'Fictitious',
      issuedAt: new Date('2025-12-01T00:00:00.000Z'),
      status: 'SUPERSEDED',
      ...range,
    },
  });
  await prismaClient.otecResolution.create({
    data: {
      id: '33000000-0000-4000-8000-000000000106',
      organizationId: tenantA,
      otecProfileId: profileA,
      resolutionType: 'AUTHORIZATION',
      resolutionNumber: 'RES-CURRENT',
      issuingAuthority: 'Fictitious',
      issuedAt: new Date('2025-12-15T00:00:00.000Z'),
      status: 'ACTIVE',
      supersedesResolutionId: '33000000-0000-4000-8000-000000000105',
      ...range,
    },
  });
}

async function seedForeignAndDeletedEvidence(): Promise<void> {
  const range = {
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validUntil: new Date('2027-01-01T00:00:00.000Z'),
  };
  await prismaClient.otecAccreditation.createMany({
    data: [
      {
        id: '33000000-0000-4000-8000-000000000198',
        organizationId: tenantB,
        otecProfileId: profileB,
        accreditationType: 'FOREIGN',
        accreditationNumber: 'FOREIGN',
        status: 'ACTIVE',
        ...range,
      },
      {
        id: '33000000-0000-4000-8000-000000000199',
        organizationId: tenantA,
        otecProfileId: profileA,
        accreditationType: 'DELETED',
        accreditationNumber: 'DELETED',
        status: 'ACTIVE',
        deletedAt: evaluatedAt,
        ...range,
      },
    ],
  });
}

function organization(id: string, taxId: string) {
  return {
    id,
    legalName: `Readiness ${id}`,
    taxId,
    email: `${id}@example.test`,
    type: 'OTEC' as const,
    status: 'ACTIVE' as const,
  };
}

function profile(id: string, organizationId: string) {
  return { id, organizationId, status: 'ACTIVE' as const };
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
