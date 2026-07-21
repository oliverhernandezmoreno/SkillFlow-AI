import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { ConflictError, NotFoundError } from '../../../../shared/domain/errors.js';
import { LegalRepresentative } from '../../domain/entities/legal-representative.entity.js';
import { OtecAccreditation } from '../../domain/entities/otec-accreditation.entity.js';
import { OtecOffice } from '../../domain/entities/otec-office.entity.js';
import { OtecResolution } from '../../domain/entities/otec-resolution.entity.js';
import { QualityCertification } from '../../domain/entities/quality-certification.entity.js';
import {
  PrismaLegalRepresentativeRepository,
  PrismaOtecAccreditationRepository,
  PrismaOtecOfficeRepository,
  PrismaOtecResolutionRepository,
  PrismaQualityCertificationRepository,
} from './prisma-otec-regulatory-record.repositories.js';

const tenantAId = '20000000-0000-4000-8000-000000000001';
const tenantBId = '20000000-0000-4000-8000-000000000002';
const profileAId = '21000000-0000-4000-8000-000000000001';
const profileBId = '21000000-0000-4000-8000-000000000002';
const evaluationDate = new Date('2026-07-16T12:00:00.000Z');

interface RecordPrimitives {
  id: string;
  organizationId: string;
  otecProfileId: string;
  validFrom: Date | null;
  validUntil: Date | null;
  deletedAt: Date | null;
  version: number;
}

interface RecordEntity {
  readonly id: string;
  toPrimitives(): RecordPrimitives;
}

interface RepositoryContract {
  findById(organizationId: string, id: string): Promise<RecordEntity | null>;
  search(
    organizationId: string,
    filters: Record<string, unknown>,
    pagination: { page: number; pageSize: number },
  ): Promise<{ data: RecordEntity[]; meta: { total: number; totalPages: number } }>;
  save(entity: RecordEntity): Promise<void>;
  update(entity: RecordEntity, expectedVersion: number): Promise<void>;
}

interface RepositoryCase {
  label: string;
  repository: RepositoryContract;
  create(organizationId: string, profileId: string, key: string, range?: DateRange): RecordEntity;
  inactive(entity: RecordEntity): RecordEntity;
  softDeleted(entity: RecordEntity): RecordEntity;
  activeFilter: Record<string, unknown>;
  partialUniqueIndex: string | null;
}

interface DateRange {
  validFrom: Date;
  validUntil: Date;
}

const currentRange: DateRange = {
  validFrom: new Date('2026-01-01T00:00:00.000Z'),
  validUntil: new Date('2026-12-31T00:00:00.000Z'),
};
const futureRange: DateRange = {
  validFrom: new Date('2027-01-01T00:00:00.000Z'),
  validUntil: new Date('2027-12-31T00:00:00.000Z'),
};

const cases: RepositoryCase[] = [
  {
    label: 'OtecAccreditationRepository',
    repository: asContract(new PrismaOtecAccreditationRepository(prismaClient)),
    create: (organizationId, profileId, key, range = currentRange) =>
      OtecAccreditation.create({
        organizationId,
        otecProfileId: profileId,
        accreditationType: 'INTERNAL_TEST',
        accreditationNumber: key,
        ...range,
      }),
    inactive: (entity) =>
      OtecAccreditation.rehydrate({
        ...entity.toPrimitives(),
        status: 'SUSPENDED',
      } as ReturnType<OtecAccreditation['toPrimitives']>),
    softDeleted: (entity) =>
      OtecAccreditation.rehydrate({
        ...entity.toPrimitives(),
        status: 'CANCELLED',
        deletedAt: new Date(),
        version: entity.toPrimitives().version + 1,
      } as ReturnType<OtecAccreditation['toPrimitives']>),
    activeFilter: { status: 'ACTIVE' },
    partialUniqueIndex: 'otec_accreditations_active_number_unique',
  },
  {
    label: 'QualityCertificationRepository',
    repository: asContract(new PrismaQualityCertificationRepository(prismaClient)),
    create: (organizationId, profileId, key, range = currentRange) =>
      QualityCertification.create({
        organizationId,
        otecProfileId: profileId,
        certificationType: 'NCH_2728',
        certificationNumber: key,
        certifyingEntity: 'Fictitious Test Entity',
        ...range,
      }),
    inactive: (entity) =>
      QualityCertification.rehydrate({
        ...entity.toPrimitives(),
        status: 'SUSPENDED',
      } as ReturnType<QualityCertification['toPrimitives']>),
    softDeleted: (entity) =>
      QualityCertification.rehydrate({
        ...entity.toPrimitives(),
        status: 'INACTIVE',
        deletedAt: new Date(),
        version: entity.toPrimitives().version + 1,
      } as ReturnType<QualityCertification['toPrimitives']>),
    activeFilter: { status: 'ACTIVE' },
    partialUniqueIndex: 'quality_certifications_active_number_unique',
  },
  {
    label: 'OtecOfficeRepository',
    repository: asContract(new PrismaOtecOfficeRepository(prismaClient)),
    create: (organizationId, profileId, key, range = currentRange) =>
      OtecOffice.create({
        organizationId,
        otecProfileId: profileId,
        officeCode: key,
        name: `Office ${key}`,
        officeType: 'HEADQUARTERS',
        street: 'Test Street 1',
        city: 'Santiago',
        commune: 'Santiago',
        region: 'Metropolitana',
        country: 'CL',
        ...range,
      }),
    inactive: (entity) =>
      OtecOffice.rehydrate({
        ...entity.toPrimitives(),
        status: 'SUSPENDED',
      } as ReturnType<OtecOffice['toPrimitives']>),
    softDeleted: (entity) =>
      OtecOffice.rehydrate({
        ...entity.toPrimitives(),
        status: 'INACTIVE',
        deletedAt: new Date(),
        version: entity.toPrimitives().version + 1,
      } as ReturnType<OtecOffice['toPrimitives']>),
    activeFilter: { status: 'ACTIVE' },
    partialUniqueIndex: 'otec_offices_active_code_unique',
  },
  {
    label: 'LegalRepresentativeRepository',
    repository: asContract(new PrismaLegalRepresentativeRepository(prismaClient)),
    create: (organizationId, profileId, key, range = currentRange) =>
      LegalRepresentative.create({
        organizationId,
        otecProfileId: profileId,
        firstName: 'Test',
        lastName: key,
        taxId: '12.345.678-5',
        roleTitle: 'Legal Representative',
        ...range,
      }),
    inactive: (entity) =>
      LegalRepresentative.rehydrate({
        ...entity.toPrimitives(),
        active: false,
      } as ReturnType<LegalRepresentative['toPrimitives']>),
    softDeleted: (entity) =>
      LegalRepresentative.rehydrate({
        ...entity.toPrimitives(),
        active: false,
        deletedAt: new Date(),
        version: entity.toPrimitives().version + 1,
      } as ReturnType<LegalRepresentative['toPrimitives']>),
    activeFilter: { status: 'ACTIVE' },
    partialUniqueIndex: null,
  },
  {
    label: 'OtecResolutionRepository',
    repository: asContract(new PrismaOtecResolutionRepository(prismaClient)),
    create: (organizationId, profileId, key, range = currentRange) =>
      OtecResolution.create({
        organizationId,
        otecProfileId: profileId,
        resolutionType: 'AUTHORIZATION',
        resolutionNumber: key,
        issuingAuthority: 'Fictitious Test Authority',
        issuedAt: new Date('2026-01-01T00:00:00.000Z'),
        ...range,
      }),
    inactive: (entity) =>
      OtecResolution.rehydrate({
        ...entity.toPrimitives(),
        status: 'SUSPENDED',
      } as ReturnType<OtecResolution['toPrimitives']>),
    softDeleted: (entity) =>
      OtecResolution.rehydrate({
        ...entity.toPrimitives(),
        status: 'INACTIVE',
        deletedAt: new Date(),
        version: entity.toPrimitives().version + 1,
      } as ReturnType<OtecResolution['toPrimitives']>),
    activeFilter: { status: 'ACTIVE' },
    partialUniqueIndex: 'otec_resolutions_active_number_unique',
  },
];

describe('OTEC regulatory Prisma repository integration contracts', () => {
  beforeAll(async () => {
    await cleanFixtures();
    await prismaClient.organization.createMany({
      data: [
        organizationFixture(tenantAId, '76.333.333-3'),
        organizationFixture(tenantBId, '76.444.444-4'),
      ],
    });
    await prismaClient.otecProfile.createMany({
      data: [profileFixture(profileAId, tenantAId), profileFixture(profileBId, tenantBId)],
    });
  });

  beforeEach(cleanRegulatoryRecords);
  afterAll(async () => {
    await cleanFixtures();
    await prismaClient.$disconnect();
  });

  for (const repositoryCase of cases) {
    describe(repositoryCase.label, () => {
      it('isolates tenant reads, excludes soft-deleted rows, filters status/validity, and paginates', async () => {
        const currentA = repositoryCase.create(tenantAId, profileAId, uniqueKey('CURRENT'));
        const secondA = repositoryCase.create(tenantAId, profileAId, uniqueKey('SECOND'));
        const futureA = repositoryCase.create(
          tenantAId,
          profileAId,
          uniqueKey('FUTURE'),
          futureRange,
        );
        const inactiveA = repositoryCase.inactive(
          repositoryCase.create(tenantAId, profileAId, uniqueKey('INACTIVE')),
        );
        const deletedA = repositoryCase.softDeleted(
          repositoryCase.create(tenantAId, profileAId, uniqueKey('DELETED')),
        );
        const currentB = repositoryCase.create(tenantBId, profileBId, uniqueKey('FOREIGN'));
        await Promise.all(
          [currentA, secondA, futureA, inactiveA, deletedA, currentB].map((entity) =>
            repositoryCase.repository.save(entity),
          ),
        );

        await expect(
          repositoryCase.repository.findById(tenantBId, currentA.id),
        ).resolves.toBeNull();
        await expect(
          repositoryCase.repository.findById(tenantAId, deletedA.id),
        ).resolves.toBeNull();
        const result = await repositoryCase.repository.search(
          tenantAId,
          { ...repositoryCase.activeFilter, validAt: evaluationDate },
          { page: 1, pageSize: 1 },
        );
        expect(result.data).toHaveLength(1);
        expect(result.meta).toMatchObject({ total: 2, totalPages: 2 });
      });

      it('uses expectedVersion atomically and rejects stale or soft-deleted updates', async () => {
        const original = repositoryCase.create(tenantAId, profileAId, uniqueKey('VERSION'));
        await repositoryCase.repository.save(original);
        const next = repositoryCase.softDeleted(original);
        await repositoryCase.repository.update(next, 1);
        const persisted = await rawRecord(repositoryCase.label, original.id);
        expect(persisted?.version).toBe(2);
        await expect(repositoryCase.repository.update(next, 1)).rejects.toBeInstanceOf(
          ConflictError,
        );
        await expect(repositoryCase.repository.update(next, 2)).rejects.toBeInstanceOf(
          ConflictError,
        );
      });

      it('rejects a cross-tenant profile relationship without disclosing it', async () => {
        const invalid = repositoryCase.create(tenantAId, profileBId, uniqueKey('CROSS'));
        await expect(repositoryCase.repository.save(invalid)).rejects.toBeInstanceOf(NotFoundError);
      });

      it('maps PostgreSQL referential-integrity rejection for a missing profile', async () => {
        const missingProfileId = randomUUID();
        const invalid = repositoryCase.create(
          tenantAId,
          missingProfileId,
          uniqueKey('MISSING-PARENT'),
        );

        await expect(repositoryCase.repository.save(invalid)).rejects.toBeInstanceOf(NotFoundError);
        await expect(repositoryCase.repository.findById(tenantAId, invalid.id)).resolves.toBeNull();
      });

      it('validates the applicable partial unique-index behavior', async () => {
        const key = uniqueKey('UNIQUE');
        const first = repositoryCase.create(tenantAId, profileAId, key);
        const duplicate = repositoryCase.create(tenantAId, profileAId, key);
        await repositoryCase.repository.save(first);
        if (repositoryCase.partialUniqueIndex === null) {
          await expect(repositoryCase.repository.save(duplicate)).resolves.toBeUndefined();
          return;
        }
        await expect(repositoryCase.repository.save(duplicate)).rejects.toBeInstanceOf(
          ConflictError,
        );
        await repositoryCase.repository.update(repositoryCase.softDeleted(first), 1);
        await expect(repositoryCase.repository.save(duplicate)).resolves.toBeUndefined();
        const indexes = await prismaClient.$queryRaw<{ indexname: string }[]>`
          SELECT indexname FROM pg_indexes WHERE indexname = ${repositoryCase.partialUniqueIndex}
        `;
        expect(indexes).toHaveLength(1);
      });
    });
  }

  describe('OtecResolutionRepository supersession', () => {
    const repository = new PrismaOtecResolutionRepository(prismaClient);

    it('atomically links a valid replacement and marks the replaced resolution', async () => {
      const replaced = createResolution(tenantAId, profileAId, uniqueKey('OLD'));
      const replacement = createResolution(tenantAId, profileAId, uniqueKey('NEW'));
      await repository.save(replaced);
      await repository.save(replacement);
      replacement.supersede(replaced.id);
      replaced.markSuperseded();

      await repository.supersede(replacement, replaced, 1, 1);

      const [storedReplacement, storedReplaced] = await Promise.all([
        prismaClient.otecResolution.findUniqueOrThrow({ where: { id: replacement.id } }),
        prismaClient.otecResolution.findUniqueOrThrow({ where: { id: replaced.id } }),
      ]);
      expect(storedReplacement).toMatchObject({ supersedesResolutionId: replaced.id, version: 2 });
      expect(storedReplaced).toMatchObject({ status: 'SUPERSEDED', version: 2 });
      const activeResolutions = await repository.search(
        tenantAId,
        { status: 'ACTIVE', validAt: evaluationDate },
        { page: 1, pageSize: 10 },
      );
      expect(activeResolutions.data.map((resolution) => resolution.id)).toContain(replacement.id);
      expect(activeResolutions.data.map((resolution) => resolution.id)).not.toContain(replaced.id);
    });

    it('rejects self-supersession before persistence', () => {
      const resolution = createResolution(tenantAId, profileAId, uniqueKey('SELF'));
      expect(() => {
        resolution.supersede(resolution.id);
      }).toThrow('A resolution cannot supersede itself');
    });

    it('rejects cross-tenant supersession and preserves both records', async () => {
      const replacement = createResolution(tenantAId, profileAId, uniqueKey('TENANT-A'));
      const replaced = createResolution(tenantBId, profileBId, uniqueKey('TENANT-B'));
      await repository.save(replacement);
      await repository.save(replaced);
      replacement.supersede(replaced.id);
      replaced.markSuperseded();

      await expect(repository.supersede(replacement, replaced, 1, 1)).rejects.toBeInstanceOf(
        NotFoundError,
      );
      await expect(
        prismaClient.otecResolution.findUniqueOrThrow({ where: { id: replacement.id } }),
      ).resolves.toMatchObject({
        supersedesResolutionId: null,
        version: 1,
      });
      await expect(
        prismaClient.otecResolution.findUniqueOrThrow({ where: { id: replaced.id } }),
      ).resolves.toMatchObject({
        status: 'ACTIVE',
        version: 1,
      });
    });

    it('prevents an indirect supersession cycle', async () => {
      const first = createResolution(tenantAId, profileAId, uniqueKey('FIRST'));
      const second = createResolution(tenantAId, profileAId, uniqueKey('SECOND'));
      await repository.save(first);
      await repository.save(second);
      first.supersede(second.id);
      second.markSuperseded();
      await repository.supersede(first, second, 1, 1);

      const storedFirst = OtecResolution.rehydrate(
        await prismaClient.otecResolution.findUniqueOrThrow({ where: { id: first.id } }),
      );
      const storedSecondRecord = await prismaClient.otecResolution.findUniqueOrThrow({
        where: { id: second.id },
      });
      const storedSecond = OtecResolution.rehydrate({
        ...storedSecondRecord,
        status: 'ACTIVE',
        supersedesResolutionId: storedFirst.id,
      });
      storedFirst.markSuperseded();

      await expect(repository.supersede(storedSecond, storedFirst, 2, 2)).rejects.toThrow(
        'Resolution supersession would create a cycle',
      );
    });

    it('rolls back both resolution updates on a concurrent version conflict', async () => {
      const replaced = createResolution(tenantAId, profileAId, uniqueKey('CONCURRENT-OLD'));
      const replacement = createResolution(tenantAId, profileAId, uniqueKey('CONCURRENT-NEW'));
      await repository.save(replaced);
      await repository.save(replacement);
      replacement.supersede(replaced.id);
      replaced.markSuperseded();
      await prismaClient.otecResolution.update({
        where: { id: replaced.id },
        data: { version: { increment: 1 } },
      });

      await expect(repository.supersede(replacement, replaced, 1, 1)).rejects.toBeInstanceOf(
        ConflictError,
      );
      await expect(
        prismaClient.otecResolution.findUniqueOrThrow({ where: { id: replacement.id } }),
      ).resolves.toMatchObject({
        supersedesResolutionId: null,
        version: 1,
      });
    });

    it('allows exactly one of two concurrent supersession attempts on the same resolution', async () => {
      const replaced = createResolution(tenantAId, profileAId, uniqueKey('RACE-OLD'));
      const firstReplacement = createResolution(tenantAId, profileAId, uniqueKey('RACE-FIRST'));
      const secondReplacement = createResolution(tenantAId, profileAId, uniqueKey('RACE-SECOND'));
      await Promise.all([
        repository.save(replaced),
        repository.save(firstReplacement),
        repository.save(secondReplacement),
      ]);
      firstReplacement.supersede(replaced.id);
      secondReplacement.supersede(replaced.id);
      const firstReplaced = OtecResolution.rehydrate(replaced.toPrimitives());
      firstReplaced.markSuperseded();
      const secondReplaced = OtecResolution.rehydrate(replaced.toPrimitives());
      secondReplaced.markSuperseded();
      const results = await Promise.allSettled([
        repository.supersede(firstReplacement, firstReplaced, 1, 1),
        repository.supersede(secondReplacement, secondReplaced, 1, 1),
      ]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
      const storedReplacements = await prismaClient.otecResolution.findMany({
        where: { id: { in: [firstReplacement.id, secondReplacement.id] } },
      });
      expect(
        storedReplacements.filter((item) => item.supersedesResolutionId === replaced.id),
      ).toHaveLength(1);
      await expect(
        prismaClient.otecResolution.findUniqueOrThrow({ where: { id: replaced.id } }),
      ).resolves.toMatchObject({ status: 'SUPERSEDED', version: 2 });
    });
  });
});

function asContract(repository: unknown): RepositoryContract {
  return repository as RepositoryContract;
}

function uniqueKey(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

function createResolution(
  organizationId: string,
  profileId: string,
  resolutionNumber: string,
): OtecResolution {
  return OtecResolution.create({
    organizationId,
    otecProfileId: profileId,
    resolutionType: 'AUTHORIZATION',
    resolutionNumber,
    issuingAuthority: 'Fictitious Test Authority',
    issuedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...currentRange,
  });
}

function organizationFixture(id: string, taxId: string) {
  return {
    id,
    legalName: `Repository Test ${id}`,
    taxId,
    email: `${id}@example.test`,
    type: 'OTEC' as const,
  };
}

function profileFixture(id: string, organizationId: string) {
  return { id, organizationId, status: 'ACTIVE' as const };
}

async function rawRecord(label: string, id: string): Promise<{ version: number } | null> {
  switch (label) {
    case 'OtecAccreditationRepository':
      return prismaClient.otecAccreditation.findUnique({ where: { id } });
    case 'QualityCertificationRepository':
      return prismaClient.qualityCertification.findUnique({ where: { id } });
    case 'OtecOfficeRepository':
      return prismaClient.otecOffice.findUnique({ where: { id } });
    case 'LegalRepresentativeRepository':
      return prismaClient.legalRepresentative.findUnique({ where: { id } });
    case 'OtecResolutionRepository':
      return prismaClient.otecResolution.findUnique({ where: { id } });
    default:
      return null;
  }
}

async function cleanRegulatoryRecords(): Promise<void> {
  await prismaClient.otecResolution.deleteMany({
    where: { organizationId: { in: [tenantAId, tenantBId] } },
  });
  await prismaClient.legalRepresentative.deleteMany({
    where: { organizationId: { in: [tenantAId, tenantBId] } },
  });
  await prismaClient.otecOffice.deleteMany({
    where: { organizationId: { in: [tenantAId, tenantBId] } },
  });
  await prismaClient.qualityCertification.deleteMany({
    where: { organizationId: { in: [tenantAId, tenantBId] } },
  });
  await prismaClient.otecAccreditation.deleteMany({
    where: { organizationId: { in: [tenantAId, tenantBId] } },
  });
}

async function cleanFixtures(): Promise<void> {
  await cleanRegulatoryRecords();
  await prismaClient.otecProfile.deleteMany({
    where: { organizationId: { in: [tenantAId, tenantBId] } },
  });
  await prismaClient.organization.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
}
