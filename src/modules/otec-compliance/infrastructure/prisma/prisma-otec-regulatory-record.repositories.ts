import {
  Prisma,
  type PrismaClient,
  LegalRepresentative as PrismaLegalRepresentative,
  OtecAccreditation as PrismaOtecAccreditation,
  OtecOffice as PrismaOtecOffice,
  OtecResolution as PrismaOtecResolution,
  QualityCertification as PrismaQualityCertification,
} from '@prisma/client';

import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../../../shared/domain/errors.js';
import { LegalRepresentative } from '../../domain/entities/legal-representative.entity.js';
import { OtecAccreditation } from '../../domain/entities/otec-accreditation.entity.js';
import { OtecOffice } from '../../domain/entities/otec-office.entity.js';
import { OtecResolution } from '../../domain/entities/otec-resolution.entity.js';
import { QualityCertification } from '../../domain/entities/quality-certification.entity.js';
import { ResolutionChainResolver } from '../../domain/services/resolution-chain-resolver.js';
import type {
  EffectiveRecordFilters,
  LegalRepresentativeRepository,
  OtecAccreditationRepository,
  OtecOfficeRepository,
  OtecOfficeFilters,
  OtecResolutionRepository,
  OtecResolutionFilters,
  QualityCertificationRepository,
  QualityCertificationFilters,
  TenantRecordRepository,
} from '../../domain/repositories/otec-regulatory-record.repositories.js';

interface PersistentTenantRecord {
  id: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

interface DomainTenantRecord<TRecord extends PersistentTenantRecord> {
  toPrimitives(): TRecord;
}

interface PrismaRecordDelegate<TRecord extends PersistentTenantRecord> {
  findFirst(args: { where: Record<string, unknown> }): Promise<TRecord | null>;
  findMany(args: {
    where: Record<string, unknown>;
    skip: number;
    take: number;
    orderBy: readonly Record<string, 'asc' | 'desc'>[];
  }): Promise<TRecord[]>;
  count(args: { where: Record<string, unknown> }): Promise<number>;
  create(args: { data: TRecord }): Promise<unknown>;
  updateMany(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<{ count: number }>;
}

abstract class PrismaTenantRecordRepository<
  TEntity extends DomainTenantRecord<TRecord>,
  TRecord extends PersistentTenantRecord,
  TFilters extends EffectiveRecordFilters<string>,
> implements TenantRecordRepository<TEntity, TFilters> {
  protected constructor(
    private readonly delegate: PrismaRecordDelegate<TRecord>,
    private readonly entityName: string,
  ) {}

  protected abstract rehydrate(record: TRecord): TEntity;

  protected filterWhere(filters: TFilters): Record<string, unknown> {
    return {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.validUntilBefore ? { validUntil: { lte: filters.validUntilBefore } } : {}),
      ...(filters.validAt
        ? {
            AND: [
              { OR: [{ validFrom: null }, { validFrom: { lte: filters.validAt } }] },
              { OR: [{ validUntil: null }, { validUntil: { gte: filters.validAt } }] },
            ],
          }
        : {}),
    };
  }

  async findById(organizationId: string, id: string): Promise<TEntity | null> {
    const record = await this.delegate.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return record ? this.rehydrate(record) : null;
  }

  async search(
    organizationId: string,
    filters: TFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<TEntity>> {
    const where = { organizationId, deletedAt: null, ...this.filterWhere(filters) };
    const [records, total] = await Promise.all([
      this.delegate.findMany({
        where,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      }),
      this.delegate.count({ where }),
    ]);
    return {
      data: records.map((record) => this.rehydrate(record)),
      meta: createPaginationMeta(pagination, total),
    };
  }

  async save(entity: TEntity): Promise<void> {
    try {
      await this.delegate.create({ data: entity.toPrimitives() });
    } catch (error) {
      throw mapPersistenceError(error, this.entityName);
    }
  }

  async update(entity: TEntity, expectedVersion: number): Promise<void> {
    const props = entity.toPrimitives();
    const { id, organizationId, createdAt: _createdAt, version: _version, ...data } = props;
    void _createdAt;
    void _version;
    const result = await this.delegate.updateMany({
      where: { id, organizationId, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    if (result.count === 0) {
      throw new ConflictError(`${this.entityName} changed; reload it before retrying`);
    }
  }
}

export class PrismaOtecAccreditationRepository
  extends PrismaTenantRecordRepository<
    OtecAccreditation,
    PrismaOtecAccreditation,
    EffectiveRecordFilters<PrismaOtecAccreditation['status']>
  >
  implements OtecAccreditationRepository
{
  constructor(prisma: PrismaClient | Prisma.TransactionClient = prismaClient) {
    super(asDelegate(prisma.otecAccreditation), 'The OTEC accreditation');
  }
  protected rehydrate(record: PrismaOtecAccreditation): OtecAccreditation {
    return OtecAccreditation.rehydrate(record);
  }
}

export class PrismaQualityCertificationRepository
  extends PrismaTenantRecordRepository<
    QualityCertification,
    PrismaQualityCertification,
    QualityCertificationFilters
  >
  implements QualityCertificationRepository
{
  constructor(prisma: PrismaClient | Prisma.TransactionClient = prismaClient) {
    super(asDelegate(prisma.qualityCertification), 'The quality certification');
  }
  protected rehydrate(record: PrismaQualityCertification): QualityCertification {
    return QualityCertification.rehydrate(record);
  }
  protected override filterWhere(filters: QualityCertificationFilters): Record<string, unknown> {
    const base = super.filterWhere(filters);
    return {
      ...base,
      ...(filters.certificationType ? { certificationType: filters.certificationType } : {}),
      ...(filters.validUntilFrom || filters.validUntilBefore
        ? {
            validUntil: {
              ...(filters.validUntilFrom ? { gte: filters.validUntilFrom } : {}),
              ...(filters.validUntilBefore ? { lte: filters.validUntilBefore } : {}),
            },
          }
        : {}),
    };
  }
}

export class PrismaOtecOfficeRepository
  extends PrismaTenantRecordRepository<OtecOffice, PrismaOtecOffice, OtecOfficeFilters>
  implements OtecOfficeRepository
{
  constructor(prisma: PrismaClient | Prisma.TransactionClient = prismaClient) {
    super(asDelegate(prisma.otecOffice), 'The OTEC office');
  }
  protected rehydrate(record: PrismaOtecOffice): OtecOffice {
    return OtecOffice.rehydrate(record);
  }
  protected override filterWhere(filters: OtecOfficeFilters): Record<string, unknown> {
    const base = super.filterWhere(filters);
    return {
      ...base,
      ...(filters.officeType ? { officeType: filters.officeType } : {}),
      ...(filters.validUntilFrom || filters.validUntilBefore
        ? {
            validUntil: {
              ...(filters.validUntilFrom ? { gte: filters.validUntilFrom } : {}),
              ...(filters.validUntilBefore ? { lte: filters.validUntilBefore } : {}),
            },
          }
        : {}),
    };
  }
}

export class PrismaLegalRepresentativeRepository
  extends PrismaTenantRecordRepository<
    LegalRepresentative,
    PrismaLegalRepresentative,
    EffectiveRecordFilters<'ACTIVE' | 'INACTIVE'>
  >
  implements LegalRepresentativeRepository
{
  constructor(prisma: PrismaClient | Prisma.TransactionClient = prismaClient) {
    super(asDelegate(prisma.legalRepresentative), 'The legal representative');
  }
  protected override filterWhere(
    filters: EffectiveRecordFilters<'ACTIVE' | 'INACTIVE'>,
  ): Record<string, unknown> {
    return {
      ...(filters.status ? { active: filters.status === 'ACTIVE' } : {}),
      ...(filters.validUntilBefore ? { validUntil: { lte: filters.validUntilBefore } } : {}),
      ...(filters.validAt
        ? {
            AND: [
              { OR: [{ validFrom: null }, { validFrom: { lte: filters.validAt } }] },
              { OR: [{ validUntil: null }, { validUntil: { gte: filters.validAt } }] },
            ],
          }
        : {}),
    };
  }
  protected rehydrate(record: PrismaLegalRepresentative): LegalRepresentative {
    return LegalRepresentative.rehydrate(record);
  }
}

export class PrismaOtecResolutionRepository
  extends PrismaTenantRecordRepository<OtecResolution, PrismaOtecResolution, OtecResolutionFilters>
  implements OtecResolutionRepository
{
  private readonly prisma: PrismaClient | Prisma.TransactionClient;

  constructor(prisma: PrismaClient | Prisma.TransactionClient = prismaClient) {
    super(asDelegate(prisma.otecResolution), 'The OTEC resolution');
    this.prisma = prisma;
  }
  protected rehydrate(record: PrismaOtecResolution): OtecResolution {
    return OtecResolution.rehydrate(record);
  }
  protected override filterWhere(filters: OtecResolutionFilters): Record<string, unknown> {
    return {
      ...super.filterWhere(filters),
      ...(filters.otecProfileId ? { otecProfileId: filters.otecProfileId } : {}),
      ...(filters.resolutionType ? { resolutionType: filters.resolutionType } : {}),
      ...(filters.validFromAfter ? { validFrom: { gt: filters.validFromAfter } } : {}),
    };
  }

  async supersede(
    replacement: OtecResolution,
    replaced: OtecResolution,
    replacementExpectedVersion: number,
    replacedExpectedVersion: number,
  ): Promise<void> {
    const replacementProps = replacement.toPrimitives();
    const replacedProps = replaced.toPrimitives();
    if (replacementProps.id === replacedProps.id) {
      throw new BadRequestError('A resolution cannot supersede itself');
    }
    if (
      replacementProps.organizationId !== replacedProps.organizationId ||
      replacementProps.otecProfileId !== replacedProps.otecProfileId
    ) {
      throw new NotFoundError('The replaced resolution was not found');
    }
    if (replacementProps.supersedesResolutionId !== replacedProps.id) {
      throw new BadRequestError('The replacement does not reference the replaced resolution');
    }
    if (replacedProps.status !== 'SUPERSEDED') {
      throw new BadRequestError('The replaced resolution must be marked as superseded');
    }

    await this.executeAtomically(async (transaction) => {
      await this.assertNoSupersessionCycle(
        transaction,
        replacementProps.organizationId,
        replacementProps.id,
        replacedProps.id,
      );
      const replacementResult = await transaction.otecResolution.updateMany({
        where: {
          id: replacementProps.id,
          organizationId: replacementProps.organizationId,
          version: replacementExpectedVersion,
          deletedAt: null,
        },
        data: {
          supersedesResolutionId: replacedProps.id,
          updatedAt: replacementProps.updatedAt,
          version: { increment: 1 },
        },
      });
      const replacedResult = await transaction.otecResolution.updateMany({
        where: {
          id: replacedProps.id,
          organizationId: replacedProps.organizationId,
          version: replacedExpectedVersion,
          deletedAt: null,
        },
        data: {
          status: 'SUPERSEDED',
          updatedAt: replacedProps.updatedAt,
          version: { increment: 1 },
        },
      });
      if (replacementResult.count !== 1 || replacedResult.count !== 1) {
        throw new ConflictError('A resolution changed; reload both resolutions before retrying');
      }
    });
  }

  private async assertNoSupersessionCycle(
    transaction: PrismaClient | Prisma.TransactionClient,
    organizationId: string,
    replacementId: string,
    replacedId: string,
  ): Promise<void> {
    const records = await transaction.otecResolution.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, supersedesResolutionId: true },
    });
    const links = new Map(records.map((record) => [record.id, record.supersedesResolutionId]));
    if (!links.has(replacedId)) throw new NotFoundError('The replaced resolution was not found');
    links.set(replacementId, replacedId);
    new ResolutionChainResolver().assertAcyclic(links);
  }
  private async executeAtomically<T>(
    work: (transaction: PrismaClient | Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    if ('$transaction' in this.prisma)
      return this.prisma.$transaction(async (transaction) => work(transaction));
    return work(this.prisma);
  }
}

function asDelegate<TRecord extends PersistentTenantRecord>(
  delegate: unknown,
): PrismaRecordDelegate<TRecord> {
  return delegate as PrismaRecordDelegate<TRecord>;
}

function mapPersistenceError(error: unknown, entityName: string): Error {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new ConflictError(`${entityName} conflicts with an active record`);
    }
    if (error.code === 'P2003') {
      return new NotFoundError(`${entityName} parent or related record was not found`);
    }
  }
  return error instanceof Error ? error : new Error('Unexpected persistence error');
}
