import {
  Prisma,
  type Enrollment as PrismaEnrollment,
  type EnrollmentStatus as PrismaEnrollmentStatus,
  type PrismaClient,
} from '@prisma/client';

import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import { ConflictError, NotFoundError } from '../../../../shared/domain/errors.js';
import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { Enrollment, type EnrollmentStatus } from '../../domain/entities/enrollment.entity.js';
import type {
  CreateEnrollmentCapacityInput,
  EnrollmentRepository,
  EnrollmentSearchFilters,
} from '../../domain/repositories/enrollment.repository.js';

export class PrismaEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findById(id: string, organizationId: string): Promise<Enrollment | null> {
    const record = await this.prisma.enrollment.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return record ? this.toDomain(record) : null;
  }

  async findBySessionAndEmployee(
    organizationId: string,
    trainingSessionId: string,
    employeeId: string,
  ): Promise<Enrollment | null> {
    const record = await this.prisma.enrollment.findUnique({
      where: { trainingSessionId_employeeId: { trainingSessionId, employeeId } },
    });

    return record?.organizationId === organizationId && !record.deletedAt
      ? this.toDomain(record)
      : null;
  }

  async search(
    filters: EnrollmentSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Enrollment>> {
    const where: Prisma.EnrollmentWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
    };
    if (filters.trainingSessionId) {
      where.trainingSessionId = filters.trainingSessionId;
    }
    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }
    if (filters.status) {
      where.status = toPrismaStatus(filters.status);
    }

    const [records, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: { enrolledAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return {
      data: records.map((record) => this.toDomain(record)),
      meta: createPaginationMeta(pagination, total),
    };
  }

  async createWithCapacity(input: CreateEnrollmentCapacityInput): Promise<Enrollment> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        // PostgreSQL row lock keeps capacity checks serialized per session in this transaction.
        await transaction.$queryRaw`
          SELECT id
          FROM "training_sessions"
          WHERE id = ${input.trainingSessionId}::uuid
            AND organization_id = ${input.organizationId}::uuid
          FOR UPDATE
        `;

        const trainingSession = await transaction.trainingSession.findFirst({
          where: {
            id: input.trainingSessionId,
            organizationId: input.organizationId,
            deletedAt: null,
          },
          select: { capacity: true },
        });
        if (!trainingSession) {
          throw new NotFoundError('Training session not found');
        }

        const occupiedSeats = await transaction.enrollment.count({
          where: {
            organizationId: input.organizationId,
            trainingSessionId: input.trainingSessionId,
            deletedAt: null,
            status: { in: input.occupiedStatuses.map(toPrismaStatus) },
          },
        });
        const status: EnrollmentStatus =
          occupiedSeats < trainingSession.capacity ? 'CONFIRMED' : 'WAITLISTED';
        const enrollment = Enrollment.create({ ...input, status });
        const props = enrollment.toPrimitives();
        const record = await transaction.enrollment.create({
          data: {
            id: props.id,
            organizationId: props.organizationId,
            trainingSessionId: props.trainingSessionId,
            employeeId: props.employeeId,
            status: toPrismaStatus(props.status),
            enrolledAt: props.enrolledAt,
            completionPercentage:
              props.completionPercentage === null
                ? null
                : new Prisma.Decimal(props.completionPercentage),
            finalScore: props.finalScore === null ? null : new Prisma.Decimal(props.finalScore),
            approved: props.approved,
            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
            deletedAt: props.deletedAt,
            version: props.version,
          },
        });

        return this.toDomain(record);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('Employee is already enrolled in this training session');
      }
      throw error;
    }
  }

  async countOccupiedSeats(
    organizationId: string,
    trainingSessionId: string,
    occupiedStatuses: EnrollmentStatus[],
  ): Promise<number> {
    return this.prisma.enrollment.count({
      where: {
        organizationId,
        trainingSessionId,
        deletedAt: null,
        status: { in: occupiedStatuses.map(toPrismaStatus) },
      },
    });
  }

  async findOldestWaitlisted(
    organizationId: string,
    trainingSessionId: string,
  ): Promise<Enrollment | null> {
    const record = await this.prisma.enrollment.findFirst({
      where: {
        organizationId,
        trainingSessionId,
        status: 'WAITLISTED',
        deletedAt: null,
      },
      orderBy: { enrolledAt: 'asc' },
    });

    return record ? this.toDomain(record) : null;
  }

  async save(enrollment: Enrollment): Promise<void> {
    const props = enrollment.toPrimitives();
    await this.prisma.enrollment.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        trainingSessionId: props.trainingSessionId,
        employeeId: props.employeeId,
        status: toPrismaStatus(props.status),
        enrolledAt: props.enrolledAt,
        completionPercentage:
          props.completionPercentage === null ? null : new Prisma.Decimal(props.completionPercentage),
        finalScore: props.finalScore === null ? null : new Prisma.Decimal(props.finalScore),
        approved: props.approved,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async update(enrollment: Enrollment): Promise<void> {
    const props = enrollment.toPrimitives();
    await this.prisma.enrollment.update({
      where: { id_organizationId: { id: props.id, organizationId: props.organizationId } },
      data: {
        status: toPrismaStatus(props.status),
        completionPercentage:
          props.completionPercentage === null ? null : new Prisma.Decimal(props.completionPercentage),
        finalScore: props.finalScore === null ? null : new Prisma.Decimal(props.finalScore),
        approved: props.approved,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  private toDomain(record: PrismaEnrollment): Enrollment {
    return Enrollment.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      trainingSessionId: record.trainingSessionId,
      employeeId: record.employeeId,
      status: fromPrismaStatus(record.status),
      enrolledAt: record.enrolledAt,
      completionPercentage:
        record.completionPercentage === null ? null : Number(record.completionPercentage),
      finalScore: record.finalScore === null ? null : Number(record.finalScore),
      approved: record.approved,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }
}

function toPrismaStatus(status: EnrollmentStatus): PrismaEnrollmentStatus {
  return status;
}

function fromPrismaStatus(status: PrismaEnrollmentStatus): EnrollmentStatus {
  return status;
}
