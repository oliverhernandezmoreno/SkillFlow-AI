import { Prisma, type PrismaClient, type Organization as PrismaOrganization } from '@prisma/client';

import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { Organization } from '../../domain/entities/organization.entity.js';
import type {
  OrganizationRepository,
  OrganizationSearchFilters,
} from '../../domain/repositories/organization.repository.js';

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findById(id: string): Promise<Organization | null> {
    const record = await this.prisma.organization.findFirst({ where: { id, deletedAt: null } });
    return record ? this.toDomain(record) : null;
  }

  async findByTaxId(taxId: string): Promise<Organization | null> {
    const record = await this.prisma.organization.findUnique({ where: { taxId } });
    return record ? this.toDomain(record) : null;
  }

  async search(
    filters: OrganizationSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Organization>> {
    const where: Prisma.OrganizationWhereInput = {
      deletedAt: null,
      ...(filters.search
        ? {
            OR: [
              { legalName: { contains: filters.search, mode: 'insensitive' } },
              { tradeName: { contains: filters.search, mode: 'insensitive' } },
              { taxId: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [records, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      data: records.map((record) => this.toDomain(record)),
      meta: createPaginationMeta(pagination, total),
    };
  }

  async save(organization: Organization): Promise<void> {
    const props = organization.toPrimitives();
    await this.prisma.organization.create({
      data: {
        id: props.id,
        legalName: props.legalName,
        tradeName: props.tradeName,
        taxId: props.taxId,
        email: props.email,
        type: props.type,
        status: props.status,
        industry: props.industry,
        country: props.country,
        settings: props.settings === null ? Prisma.JsonNull : (props.settings as Prisma.InputJsonValue),
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async update(organization: Organization): Promise<void> {
    const props = organization.toPrimitives();
    await this.prisma.organization.update({
      where: { id: props.id },
      data: {
        legalName: props.legalName,
        tradeName: props.tradeName,
        email: props.email,
        type: props.type,
        status: props.status,
        industry: props.industry,
        country: props.country,
        settings: props.settings === null ? Prisma.JsonNull : (props.settings as Prisma.InputJsonValue),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  private toDomain(record: PrismaOrganization): Organization {
    return Organization.rehydrate({
      id: record.id,
      legalName: record.legalName,
      tradeName: record.tradeName,
      taxId: record.taxId,
      email: record.email,
      type: record.type,
      status: record.status,
      industry: record.industry,
      country: record.country,
      settings: isRecord(record.settings) ? record.settings : null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
