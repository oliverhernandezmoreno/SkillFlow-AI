import {
  Prisma,
  type PrismaClient,
  type TrainingSession as PrismaTrainingSession,
  type TrainingSessionStatus as PrismaTrainingSessionStatus,
} from '@prisma/client';

import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import {
  TrainingSession,
  type TrainingSessionStatus,
} from '../../domain/entities/training-session.entity.js';
import type {
  TrainingSessionRepository,
  TrainingSessionSearchFilters,
} from '../../domain/repositories/training-session.repository.js';

export class PrismaTrainingSessionRepository implements TrainingSessionRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findById(id: string, organizationId: string): Promise<TrainingSession | null> {
    const record = await this.prisma.trainingSession.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return record ? this.toDomain(record) : null;
  }

  async search(
    filters: TrainingSessionSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<TrainingSession>> {
    const where: Prisma.TrainingSessionWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
    };
    if (filters.courseId) {
      where.courseId = filters.courseId;
    }
    if (filters.status) {
      where.status = toPrismaStatus(filters.status);
    }
    if (filters.from || filters.to) {
      where.startDate = {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lte: filters.to } : {}),
      };
    }

    const [records, total] = await Promise.all([
      this.prisma.trainingSession.findMany({
        where,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.trainingSession.count({ where }),
    ]);

    return {
      data: records.map((record) => this.toDomain(record)),
      meta: createPaginationMeta(pagination, total),
    };
  }

  async save(trainingSession: TrainingSession): Promise<void> {
    const props = trainingSession.toPrimitives();
    await this.prisma.trainingSession.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        courseId: props.courseId,
        trainingPlanItemId: props.trainingPlanItemId,
        providerId: props.providerId,
        instructorId: props.instructorId,
        name: props.name,
        startDate: props.startDate,
        endDate: props.endDate,
        location: props.location,
        capacity: props.capacity,
        costAmount: props.costAmount === null ? null : new Prisma.Decimal(props.costAmount),
        meetingUrl: props.meetingUrl,
        status: toPrismaStatus(props.status),
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async update(trainingSession: TrainingSession): Promise<void> {
    const props = trainingSession.toPrimitives();
    await this.prisma.trainingSession.update({
      where: { id_organizationId: { id: props.id, organizationId: props.organizationId } },
      data: {
        courseId: props.courseId,
        trainingPlanItemId: props.trainingPlanItemId,
        providerId: props.providerId,
        instructorId: props.instructorId,
        name: props.name,
        startDate: props.startDate,
        endDate: props.endDate,
        location: props.location,
        capacity: props.capacity,
        costAmount: props.costAmount === null ? null : new Prisma.Decimal(props.costAmount),
        meetingUrl: props.meetingUrl,
        status: toPrismaStatus(props.status),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  private toDomain(record: PrismaTrainingSession): TrainingSession {
    return TrainingSession.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      courseId: record.courseId,
      trainingPlanItemId: record.trainingPlanItemId,
      providerId: record.providerId,
      instructorId: record.instructorId,
      name: record.name,
      startDate: record.startDate,
      endDate: record.endDate,
      location: record.location,
      capacity: record.capacity,
      costAmount: record.costAmount === null ? null : Number(record.costAmount),
      meetingUrl: record.meetingUrl,
      status: fromPrismaStatus(record.status),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }
}

function toPrismaStatus(status: TrainingSessionStatus): PrismaTrainingSessionStatus {
  return status;
}

function fromPrismaStatus(status: PrismaTrainingSessionStatus): TrainingSessionStatus {
  return status;
}
