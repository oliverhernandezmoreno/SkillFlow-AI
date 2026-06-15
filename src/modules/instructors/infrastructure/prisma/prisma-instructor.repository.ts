import {
  Prisma,
  type Instructor as PrismaInstructor,
  type PrismaClient,
  type ProviderStatus as PrismaProviderStatus,
} from '@prisma/client';

import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import {
  Instructor,
  type InstructorStatus,
} from '../../domain/entities/instructor.entity.js';
import type {
  InstructorRepository,
  InstructorSearchFilters,
} from '../../domain/repositories/instructor.repository.js';

export class PrismaInstructorRepository implements InstructorRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findById(id: string, organizationId: string): Promise<Instructor | null> {
    const record = await this.prisma.instructor.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(organizationId: string, normalizedEmail: string): Promise<Instructor | null> {
    const record = await this.prisma.instructor.findUnique({
      where: { organizationId_normalizedEmail: { organizationId, normalizedEmail } },
    });
    return record && !record.deletedAt ? this.toDomain(record) : null;
  }

  async search(
    filters: InstructorSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Instructor>> {
    const where: Prisma.InstructorWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.search
        ? {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    if (filters.status) {
      where.status = toPrismaStatus(filters.status);
    }
    if (filters.providerId) {
      where.providerId = filters.providerId;
    }

    const [records, total] = await Promise.all([
      this.prisma.instructor.findMany({
        where,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
      this.prisma.instructor.count({ where }),
    ]);

    return {
      data: records.map((record) => this.toDomain(record)),
      meta: createPaginationMeta(pagination, total),
    };
  }

  async save(instructor: Instructor): Promise<void> {
    const props = instructor.toPrimitives();
    await this.prisma.instructor.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        userId: props.userId,
        providerId: props.providerId,
        rut: props.rut,
        firstName: props.firstName,
        lastName: props.lastName,
        email: props.email,
        normalizedEmail: props.normalizedEmail,
        phone: props.phone,
        specialties: props.specialties,
        status: toPrismaStatus(props.status),
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async update(instructor: Instructor): Promise<void> {
    const props = instructor.toPrimitives();
    await this.prisma.instructor.update({
      where: { id_organizationId: { id: props.id, organizationId: props.organizationId } },
      data: {
        userId: props.userId,
        providerId: props.providerId,
        rut: props.rut,
        firstName: props.firstName,
        lastName: props.lastName,
        email: props.email,
        normalizedEmail: props.normalizedEmail,
        phone: props.phone,
        specialties: props.specialties,
        status: toPrismaStatus(props.status),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  private toDomain(record: PrismaInstructor): Instructor {
    return Instructor.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      userId: record.userId,
      providerId: record.providerId,
      rut: record.rut,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      normalizedEmail: record.normalizedEmail,
      phone: record.phone,
      specialties: record.specialties,
      status: fromPrismaStatus(record.status),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }
}

function toPrismaStatus(status: InstructorStatus): PrismaProviderStatus {
  return status;
}

function fromPrismaStatus(status: PrismaProviderStatus): InstructorStatus {
  return status;
}
