import { Prisma, type OtecProfile as PrismaOtecProfile, type PrismaClient } from '@prisma/client';

import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { ConflictError } from '../../../../shared/domain/errors.js';
import { OtecProfile } from '../../domain/entities/otec-profile.entity.js';
import type {
  OtecProfileRepository,
  OtecProfileSearchFilters,
} from '../../domain/repositories/otec-profile.repository.js';

export class PrismaOtecProfileRepository implements OtecProfileRepository {
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient = prismaClient) {}

  async findCurrentByOrganizationId(organizationId: string): Promise<OtecProfile | null> {
    const records = await this.prisma.otecProfile.findMany({
      where: { organizationId, status: 'ACTIVE', deletedAt: null },
      take: 2,
    });
    if (records.length > 1) {
      throw new Error('Current OTEC profile cardinality invariant violated');
    }
    const record = records[0];
    return record ? this.toDomain(record) : null;
  }

  async findById(organizationId: string, id: string): Promise<OtecProfile | null> {
    const record = await this.prisma.otecProfile.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return record ? this.toDomain(record) : null;
  }

  async search(
    organizationId: string,
    filters: OtecProfileSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<OtecProfile>> {
    const where = {
      organizationId,
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : {}),
    };
    const [records, total] = await Promise.all([
      this.prisma.otecProfile.findMany({
        where,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      }),
      this.prisma.otecProfile.count({ where }),
    ]);
    return {
      data: records.map((record) => this.toDomain(record)),
      meta: createPaginationMeta(pagination, total),
    };
  }

  async save(profile: OtecProfile): Promise<void> {
    const props = profile.toPrimitives();
    try {
      await this.prisma.otecProfile.create({
        data: {
          id: props.id,
          organizationId: props.organizationId,
          registrationCode: props.registrationCode,
          status: props.registrationStatus,
          rudoReference: props.rudoReference,
          accreditationDate: props.accreditationDate,
          suspensionDate: props.suspensionDate,
          cessationDate: props.cessationDate,
          technicalContactName: props.technicalContactName,
          technicalContactEmail: props.technicalContactEmail,
          technicalContactPhone: props.technicalContactPhone,
          notes: props.notes,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
          deletedAt: props.deletedAt,
          version: props.version,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('An active OTEC profile already exists');
      }
      throw error;
    }
  }

  async update(profile: OtecProfile, expectedVersion: number): Promise<void> {
    const props = profile.toPrimitives();
    const result = await this.prisma.otecProfile.updateMany({
      where: {
        id: props.id,
        organizationId: props.organizationId,
        version: expectedVersion,
        deletedAt: null,
      },
      data: {
        registrationCode: props.registrationCode,
        status: props.registrationStatus,
        rudoReference: props.rudoReference,
        accreditationDate: props.accreditationDate,
        suspensionDate: props.suspensionDate,
        cessationDate: props.cessationDate,
        technicalContactName: props.technicalContactName,
        technicalContactEmail: props.technicalContactEmail,
        technicalContactPhone: props.technicalContactPhone,
        notes: props.notes,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: { increment: 1 },
      },
    });
    if (result.count === 0) {
      throw new ConflictError('The OTEC profile changed; reload it before retrying');
    }
  }

  private toDomain(record: PrismaOtecProfile): OtecProfile {
    return OtecProfile.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      registrationCode: record.registrationCode,
      registrationStatus: record.status,
      rudoReference: record.rudoReference,
      accreditationDate: record.accreditationDate,
      suspensionDate: record.suspensionDate,
      cessationDate: record.cessationDate,
      technicalContactName: record.technicalContactName,
      technicalContactEmail: record.technicalContactEmail,
      technicalContactPhone: record.technicalContactPhone,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }
}
