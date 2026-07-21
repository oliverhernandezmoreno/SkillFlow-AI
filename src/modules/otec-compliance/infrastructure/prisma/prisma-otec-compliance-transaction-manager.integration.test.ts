import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { OtecAccreditation } from '../../domain/entities/otec-accreditation.entity.js';
import { LegalRepresentative } from '../../domain/entities/legal-representative.entity.js';
import { OtecOffice } from '../../domain/entities/otec-office.entity.js';
import { OtecResolution } from '../../domain/entities/otec-resolution.entity.js';
import { QualityCertification } from '../../domain/entities/quality-certification.entity.js';
import { UpdateOtecProfileUseCase } from '../../application/use-cases/update-otec-profile.use-case.js';
import { DeactivateOtecProfileUseCase } from '../../application/use-cases/deactivate-otec-profile.use-case.js';
import { OtecComplianceAuthorizationPolicy } from '../../application/services/otec-compliance-authorization.policy.js';
import { PrismaOtecComplianceTransactionManager } from './prisma-otec-compliance-transaction-manager.js';

const organizationId = '23000000-0000-4000-8000-000000000001';
const profileId = '23100000-0000-4000-8000-000000000001';
const actorUserId = '23200000-0000-4000-8000-000000000001';

describe('PrismaOtecComplianceTransactionManager integration', () => {
  const transactionManager = new PrismaOtecComplianceTransactionManager(prismaClient);

  beforeAll(async () => {
    await cleanFixtures();
    await prismaClient.organization.create({
      data: {
        id: organizationId,
        legalName: 'Transactional Foundation Test OTEC',
        taxId: '76.666.666-6',
        email: 'transaction-foundation@example.test',
        type: 'OTEC',
      },
    });
    await prismaClient.user.create({
      data: {
        id: actorUserId,
        organizationId,
        firstName: 'Singleton',
        lastName: 'Tester',
        email: 'singleton-profile@example.test',
        normalizedEmail: 'singleton-profile@example.test',
        passwordHash: 'not-a-real-password-hash',
      },
    });
    await prismaClient.otecProfile.create({
      data: { id: profileId, organizationId, status: 'ACTIVE' },
    });
  });

  beforeEach(async () => {
    await prismaClient.auditEvent.deleteMany({ where: { organizationId } });
    await prismaClient.otecAccreditation.deleteMany({ where: { organizationId } });
    await prismaClient.otecOffice.deleteMany({ where: { organizationId } });
    await prismaClient.legalRepresentative.deleteMany({ where: { organizationId } });
    await prismaClient.otecResolution.deleteMany({ where: { organizationId } });
    await prismaClient.otecProfile.update({
      where: { id: profileId },
      data: { status: 'ACTIVE', deletedAt: null, notes: null, version: 1 },
    });
  });

  afterAll(async () => {
    await cleanFixtures();
    await prismaClient.$disconnect();
  });

  it('commits the accreditation and audit event in one transaction', async () => {
    const accreditation = createAccreditation();

    await transactionManager.run(async (unitOfWork) => {
      await unitOfWork.otecAccreditationRepository.save(accreditation);
      await unitOfWork.auditLogger.record({
        organizationId,
        actorUserId: null,
        entityType: 'OtecAccreditation',
        entityId: accreditation.id,
        action: 'OTEC_ACCREDITATION_CREATED',
        metadata: {},
      });
    });

    await expect(
      prismaClient.otecAccreditation.count({ where: { id: accreditation.id } }),
    ).resolves.toBe(1);
    await expect(
      prismaClient.auditEvent.count({
        where: { organizationId, entityId: accreditation.id, action: 'OTEC_ACCREDITATION_CREATED' },
      }),
    ).resolves.toBe(1);
  });

  it('rolls back the accreditation when audit persistence fails', async () => {
    const accreditation = createAccreditation();
    const missingActorUserId = randomUUID();

    await expect(
      transactionManager.run(async (unitOfWork) => {
        await unitOfWork.otecAccreditationRepository.save(accreditation);
        await unitOfWork.auditLogger.record({
          organizationId,
          actorUserId: missingActorUserId,
          entityType: 'OtecAccreditation',
          entityId: accreditation.id,
          action: 'OTEC_ACCREDITATION_CREATED',
          metadata: {},
        });
      }),
    ).rejects.toThrow();

    await expect(
      prismaClient.otecAccreditation.count({ where: { id: accreditation.id } }),
    ).resolves.toBe(0);
    await expect(
      prismaClient.auditEvent.count({ where: { organizationId, entityId: accreditation.id } }),
    ).resolves.toBe(0);
  });

  it('rolls back an OTEC profile update and version when audit persistence fails', async () => {
    const before = await prismaClient.otecProfile.findUniqueOrThrow({ where: { id: profileId } });
    const useCase = new UpdateOtecProfileUseCase(
      transactionManager,
      new OtecComplianceAuthorizationPolicy({
        evaluate: async () => ({ allowed: true, reason: 'ENABLED' }),
      }),
    );
    await expect(
      useCase.execute(
        { expectedVersion: before.version, notes: 'Must roll back' },
        {
          organizationId,
          actorUserId: randomUUID(),
          permissions: ['otec_compliance.profile.manage'],
        },
      ),
    ).rejects.toThrow();

    await expect(
      prismaClient.otecProfile.findUniqueOrThrow({ where: { id: profileId } }),
    ).resolves.toMatchObject({ notes: before.notes, version: before.version });
    await expect(
      prismaClient.auditEvent.count({ where: { organizationId, entityId: profileId } }),
    ).resolves.toBe(0);
  });

  it('commits a singleton profile update and audit atomically with the expected version', async () => {
    const useCase = new UpdateOtecProfileUseCase(transactionManager, authorization());

    const result = await useCase.execute(
      { expectedVersion: 1, notes: 'Singleton update' },
      profileContext(),
    );

    expect(result).toMatchObject({ id: profileId, notes: 'Singleton update', version: 2 });
    await expect(
      prismaClient.auditEvent.count({
        where: { organizationId, entityId: profileId, action: 'OTEC_PROFILE_UPDATED' },
      }),
    ).resolves.toBe(1);
  });

  it('commits singleton deactivation as soft deletion with its audit in one transaction', async () => {
    const useCase = new DeactivateOtecProfileUseCase(transactionManager, authorization());

    await useCase.execute({ expectedVersion: 1 }, profileContext());

    await expect(
      prismaClient.otecProfile.findUniqueOrThrow({ where: { id: profileId } }),
    ).resolves.toMatchObject({ status: 'INACTIVE', version: 2 });
    expect(
      (await prismaClient.otecProfile.findUniqueOrThrow({ where: { id: profileId } })).deletedAt,
    ).toBeInstanceOf(Date);
    await expect(
      prismaClient.auditEvent.count({
        where: { organizationId, entityId: profileId, action: 'OTEC_PROFILE_DEACTIVATED' },
      }),
    ).resolves.toBe(1);
  });

  it('rolls back a quality certification when audit persistence fails', async () => {
    const certification = QualityCertification.create({
      organizationId,
      otecProfileId: profileId,
      certificationType: 'NCH_2728',
      certificationNumber: `TX-CERT-${randomUUID()}`,
      certifyingEntity: 'Fictitious Transaction Test Entity',
      validFrom: new Date('2026-01-01T00:00:00.000Z'),
      validUntil: new Date('2027-01-01T00:00:00.000Z'),
    });

    await expect(
      transactionManager.run(async (unitOfWork) => {
        await unitOfWork.qualityCertificationRepository.save(certification);
        await unitOfWork.auditLogger.record({
          organizationId,
          actorUserId: randomUUID(),
          entityType: 'QualityCertification',
          entityId: certification.id,
          action: 'QUALITY_CERTIFICATION_CREATED',
          metadata: {},
        });
      }),
    ).rejects.toThrow();

    await expect(
      prismaClient.qualityCertification.count({ where: { id: certification.id } }),
    ).resolves.toBe(0);
  });

  it('rolls back an OTEC office when audit persistence fails', async () => {
    const office = OtecOffice.create({
      organizationId,
      otecProfileId: profileId,
      officeCode: `TX-OFFICE-${randomUUID()}`,
      name: 'Fictitious Transaction Office',
      officeType: 'HEADQUARTERS',
      street: 'Test Street 1',
      city: 'Santiago',
      commune: 'Santiago',
      region: 'Metropolitana',
      country: 'CL',
    });
    await expect(
      transactionManager.run(async (unitOfWork) => {
        await unitOfWork.otecOfficeRepository.save(office);
        await unitOfWork.auditLogger.record({
          organizationId,
          actorUserId: randomUUID(),
          entityType: 'OtecOffice',
          entityId: office.id,
          action: 'OTEC_OFFICE_CREATED',
          metadata: {},
        });
      }),
    ).rejects.toThrow();
    await expect(prismaClient.otecOffice.count({ where: { id: office.id } })).resolves.toBe(0);
  });

  it('rolls back a legal representative when audit persistence fails', async () => {
    const representative = LegalRepresentative.create({
      organizationId,
      otecProfileId: profileId,
      firstName: 'Fictitious',
      lastName: 'Representative',
      taxId: '12.345.678-5',
      roleTitle: 'Legal Representative',
    });
    await expect(
      transactionManager.run(async (unitOfWork) => {
        await unitOfWork.legalRepresentativeRepository.save(representative);
        await unitOfWork.auditLogger.record({
          organizationId,
          actorUserId: randomUUID(),
          entityType: 'LegalRepresentative',
          entityId: representative.id,
          action: 'LEGAL_REPRESENTATIVE_CREATED',
          metadata: {},
        });
      }),
    ).rejects.toThrow();
    await expect(
      prismaClient.legalRepresentative.count({ where: { id: representative.id } }),
    ).resolves.toBe(0);
  });

  it('rolls back an OTEC resolution when audit persistence fails', async () => {
    const resolution = OtecResolution.create({
      organizationId,
      otecProfileId: profileId,
      resolutionType: 'AUTHORIZATION',
      resolutionNumber: `TX-RES-${randomUUID()}`,
      issuingAuthority: 'Fictitious Transaction Authority',
      issuedAt: new Date('2026-01-01'),
    });
    await expect(
      transactionManager.run(async (unitOfWork) => {
        await unitOfWork.otecResolutionRepository.save(resolution);
        await unitOfWork.auditLogger.record({
          organizationId,
          actorUserId: randomUUID(),
          entityType: 'OtecResolution',
          entityId: resolution.id,
          action: 'OTEC_RESOLUTION_CREATED',
          metadata: {},
        });
      }),
    ).rejects.toThrow();
    await expect(prismaClient.otecResolution.count({ where: { id: resolution.id } })).resolves.toBe(
      0,
    );
  });

  it('rolls back both supersession sides when audit persistence fails', async () => {
    const replaced = OtecResolution.create({
      organizationId,
      otecProfileId: profileId,
      resolutionType: 'AUTHORIZATION',
      resolutionNumber: `TX-OLD-${randomUUID()}`,
      issuingAuthority: 'Fictitious Transaction Authority',
      issuedAt: new Date('2026-01-01'),
    });
    const replacement = OtecResolution.create({
      organizationId,
      otecProfileId: profileId,
      resolutionType: 'AUTHORIZATION',
      resolutionNumber: `TX-NEW-${randomUUID()}`,
      issuingAuthority: 'Fictitious Transaction Authority',
      issuedAt: new Date('2026-02-01'),
    });
    await prismaClient.otecResolution.createMany({
      data: [replaced.toPrimitives(), replacement.toPrimitives()],
    });
    await expect(
      transactionManager.run(async (unitOfWork) => {
        const transactionalReplaced = await unitOfWork.otecResolutionRepository.findById(
          organizationId,
          replaced.id,
        );
        const transactionalReplacement = await unitOfWork.otecResolutionRepository.findById(
          organizationId,
          replacement.id,
        );
        if (!transactionalReplaced || !transactionalReplacement)
          throw new Error('Missing transaction fixtures');
        transactionalReplacement.supersede(transactionalReplaced.id);
        transactionalReplaced.markSuperseded();
        await unitOfWork.otecResolutionRepository.supersede(
          transactionalReplacement,
          transactionalReplaced,
          1,
          1,
        );
        await unitOfWork.auditLogger.record({
          organizationId,
          actorUserId: randomUUID(),
          entityType: 'OtecResolution',
          entityId: replacement.id,
          action: 'OTEC_RESOLUTION_SUPERSEDED',
          metadata: { replacedResolutionId: replaced.id },
        });
      }),
    ).rejects.toThrow();
    await expect(
      prismaClient.otecResolution.findUniqueOrThrow({ where: { id: replaced.id } }),
    ).resolves.toMatchObject({ status: 'ACTIVE', version: 1 });
    await expect(
      prismaClient.otecResolution.findUniqueOrThrow({ where: { id: replacement.id } }),
    ).resolves.toMatchObject({ supersedesResolutionId: null, version: 1 });
  });
});

function createAccreditation(): OtecAccreditation {
  return OtecAccreditation.create({
    organizationId,
    otecProfileId: profileId,
    accreditationType: 'INTERNAL_TEST',
    accreditationNumber: `TX-${randomUUID()}`,
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validUntil: new Date('2026-12-31T00:00:00.000Z'),
  });
}

function authorization(): OtecComplianceAuthorizationPolicy {
  return new OtecComplianceAuthorizationPolicy({
    evaluate: async () => ({ allowed: true, reason: 'ENABLED' }),
  });
}

function profileContext() {
  return {
    organizationId,
    actorUserId,
    permissions: ['otec_compliance.profile.manage'],
  };
}

async function cleanFixtures(): Promise<void> {
  await prismaClient.auditEvent.deleteMany({ where: { organizationId } });
  await prismaClient.qualityCertification.deleteMany({ where: { organizationId } });
  await prismaClient.otecOffice.deleteMany({ where: { organizationId } });
  await prismaClient.legalRepresentative.deleteMany({ where: { organizationId } });
  await prismaClient.otecResolution.deleteMany({ where: { organizationId } });
  await prismaClient.otecAccreditation.deleteMany({ where: { organizationId } });
  await prismaClient.otecProfile.deleteMany({ where: { organizationId } });
  await prismaClient.user.deleteMany({ where: { organizationId } });
  await prismaClient.organization.deleteMany({ where: { id: organizationId } });
}
