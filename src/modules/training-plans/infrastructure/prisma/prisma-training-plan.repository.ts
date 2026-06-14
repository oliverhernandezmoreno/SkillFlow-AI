import {
  Prisma,
  type PrismaClient,
  type TrainingPlan as PrismaTrainingPlan,
  type TrainingPlanItem as PrismaTrainingPlanItem,
  type TrainingPlanStatus as PrismaTrainingPlanStatus,
} from '@prisma/client';

import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { TrainingPlanItem } from '../../domain/entities/training-plan-item.entity.js';
import { TrainingPlan, type TrainingPlanStatus } from '../../domain/entities/training-plan.entity.js';
import type {
  TrainingPlanRepository,
  TrainingPlanSearchFilters,
} from '../../domain/repositories/training-plan.repository.js';

type PrismaTrainingPlanWithItems = PrismaTrainingPlan & { items: PrismaTrainingPlanItem[] };

export class PrismaTrainingPlanRepository implements TrainingPlanRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findById(id: string, organizationId: string): Promise<TrainingPlan | null> {
    const record = await this.prisma.trainingPlan.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { items: { where: { deletedAt: null } } },
    });

    return record ? this.toDomain(record) : null;
  }

  async findByOrganizationYear(
    organizationId: string,
    year: number,
  ): Promise<TrainingPlan | null> {
    const record = await this.prisma.trainingPlan.findUnique({
      where: { organizationId_year: { organizationId, year } },
      include: { items: { where: { deletedAt: null } } },
    });

    return record && !record.deletedAt ? this.toDomain(record) : null;
  }

  async search(
    filters: TrainingPlanSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<TrainingPlan>> {
    const where: Prisma.TrainingPlanWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
    };
    if (filters.year !== undefined) {
      where.year = filters.year;
    }
    if (filters.status !== undefined) {
      where.status = toPrismaStatus(filters.status);
    }
    const [records, total] = await Promise.all([
      this.prisma.trainingPlan.findMany({
        where,
        include: { items: { where: { deletedAt: null } } },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.trainingPlan.count({ where }),
    ]);

    return {
      data: records.map((record) => this.toDomain(record)),
      meta: createPaginationMeta(pagination, total),
    };
  }

  async save(trainingPlan: TrainingPlan): Promise<void> {
    const props = trainingPlan.toPrimitives();
    await this.prisma.trainingPlan.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        year: props.year,
        name: props.name,
        budgetAmount: new Prisma.Decimal(props.budgetAmount),
        currency: props.currency,
        status: toPrismaStatus(props.status),
        submittedAt: props.submittedAt,
        approvedAt: props.approvedAt,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async update(trainingPlan: TrainingPlan): Promise<void> {
    const props = trainingPlan.toPrimitives();
    await this.prisma.trainingPlan.update({
      where: { id_organizationId: { id: props.id, organizationId: props.organizationId } },
      data: {
        name: props.name,
        budgetAmount: new Prisma.Decimal(props.budgetAmount),
        currency: props.currency,
        status: toPrismaStatus(props.status),
        submittedAt: props.submittedAt,
        approvedAt: props.approvedAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async saveItem(item: TrainingPlanItem): Promise<void> {
    const props = item.toPrimitives();
    await this.prisma.trainingPlanItem.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        trainingPlanId: props.trainingPlanId,
        courseId: props.courseId,
        plannedMonth: props.plannedMonth,
        quarter: props.quarter,
        estimatedParticipants: props.estimatedParticipants,
        estimatedCost: new Prisma.Decimal(props.estimatedCost),
        priority: props.priority,
        businessJustification: props.businessJustification,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  private toDomain(record: PrismaTrainingPlanWithItems): TrainingPlan {
    return TrainingPlan.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      year: record.year,
      name: record.name,
      budgetAmount: Number(record.budgetAmount),
      currency: record.currency,
      status: fromPrismaStatus(record.status),
      submittedAt: record.submittedAt,
      approvedAt: record.approvedAt,
      items: record.items.map((item) => this.itemToDomain(item)),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }

  private itemToDomain(record: PrismaTrainingPlanItem): TrainingPlanItem {
    return TrainingPlanItem.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      trainingPlanId: record.trainingPlanId,
      courseId: record.courseId,
      plannedMonth: record.plannedMonth,
      quarter: record.quarter,
      estimatedParticipants: record.estimatedParticipants,
      estimatedCost: Number(record.estimatedCost),
      priority: record.priority,
      businessJustification: record.businessJustification,
      targetCompetencies: [],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }
}

function toPrismaStatus(status: TrainingPlanStatus): PrismaTrainingPlanStatus {
  if (status === 'IN_REVIEW') {
    return 'SUBMITTED';
  }
  if (status === 'EXECUTING' || status === 'COMPLETED') {
    return 'CLOSED';
  }

  return status;
}

function fromPrismaStatus(status: PrismaTrainingPlanStatus): TrainingPlanStatus {
  if (status === 'SUBMITTED') {
    return 'IN_REVIEW';
  }
  if (status === 'CLOSED') {
    return 'COMPLETED';
  }

  return status;
}
