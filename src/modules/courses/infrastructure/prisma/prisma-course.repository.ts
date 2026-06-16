import type { Course as PrismaCourse, Prisma, PrismaClient } from '@prisma/client';

import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { Course } from '../../domain/entities/course.entity.js';
import type { CourseRepository, CourseSearchFilters } from '../../domain/repositories/course.repository.js';

export class PrismaCourseRepository implements CourseRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findById(id: string, organizationId: string): Promise<Course | null> {
    const record = await this.prisma.course.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByCode(organizationId: string, code: string): Promise<Course | null> {
    const record = await this.prisma.course.findUnique({
      where: { organizationId_code: { organizationId, code } },
    });
    return record ? this.toDomain(record) : null;
  }

  async search(
    filters: CourseSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Course>> {
    const where: Prisma.CourseWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.search
        ? {
            OR: [
              { code: { contains: filters.search, mode: 'insensitive' } },
              { name: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    if (filters.modality) {
      where.modality = filters.modality;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    const [records, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: records.map((record) => this.toDomain(record)),
      meta: createPaginationMeta(pagination, total),
    };
  }

  async save(course: Course): Promise<void> {
    await this.prisma.course.create({ data: this.toPersistence(course) });
  }

  async update(course: Course): Promise<void> {
    const props = course.toPrimitives();
    await this.prisma.course.update({
      where: { id_organizationId: { id: props.id, organizationId: props.organizationId } },
      data: this.toPersistence(course),
    });
  }

  private toPersistence(course: Course): Prisma.CourseUncheckedCreateInput {
    const props = course.toPrimitives();
    return {
      id: props.id,
      organizationId: props.organizationId,
      code: props.code,
      name: props.name,
      description: props.description,
      modality: props.modality,
      durationHours: props.durationHours,
      status: props.status,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt,
      version: props.version,
    };
  }

  private toDomain(record: PrismaCourse): Course {
    return Course.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      code: record.code,
      name: record.name,
      description: record.description ?? '',
      modality: record.modality,
      durationHours: Number(record.durationHours),
      status: record.status,
      competencies: [],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }
}
