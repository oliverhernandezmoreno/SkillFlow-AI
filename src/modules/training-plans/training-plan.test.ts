import { describe, expect, it } from 'vitest';

import type { AuditLogger, AuditLogInput } from '../../shared/application/audit-logger.js';
import type { PaginatedResult, PaginationInput } from '../../shared/application/pagination.js';
import { ConflictError } from '../../shared/domain/errors.js';
import { CreateTrainingPlanUseCase } from './application/use-cases/create-training-plan.use-case.js';
import { ApproveTrainingPlanUseCase } from './application/use-cases/approve-training-plan.use-case.js';
import { CreateTrainingPlanItemUseCase } from './application/use-cases/create-training-plan-item.use-case.js';
import type { TrainingPlanItem } from './domain/entities/training-plan-item.entity.js';
import type { TrainingPlan, TrainingPlanStatus } from './domain/entities/training-plan.entity.js';
import type {
  TrainingPlanRepository,
  TrainingPlanSearchFilters,
} from './domain/repositories/training-plan.repository.js';
import {
  createTrainingPlanItemSchema,
  createTrainingPlanSchema,
} from './interfaces/http/validators/training-plan.validators.js';

class FakeTrainingPlanRepository implements TrainingPlanRepository {
  trainingPlans: TrainingPlan[] = [];
  items: TrainingPlanItem[] = [];

  async findById(id: string): Promise<TrainingPlan | null> {
    return this.trainingPlans.find((trainingPlan) => trainingPlan.id === id) ?? null;
  }

  async findByOrganizationYear(organizationId: string, year: number): Promise<TrainingPlan | null> {
    return (
      this.trainingPlans.find((trainingPlan) => {
        const props = trainingPlan.toPrimitives();
        return props.organizationId === organizationId && props.year === year;
      }) ?? null
    );
  }

  async search(
    filters: TrainingPlanSearchFilters,
    _pagination: PaginationInput,
  ): Promise<PaginatedResult<TrainingPlan>> {
    const data = this.trainingPlans.filter((trainingPlan) => {
      const props = trainingPlan.toPrimitives();
      return (
        props.organizationId === filters.organizationId &&
        (filters.year === undefined || props.year === filters.year) &&
        (filters.status === undefined || props.status === filters.status)
      );
    });

    return { data, meta: { page: 1, pageSize: 20, total: data.length, totalPages: 1 } };
  }

  async save(trainingPlan: TrainingPlan): Promise<void> {
    this.trainingPlans.push(trainingPlan);
  }

  async update(trainingPlan: TrainingPlan): Promise<void> {
    this.trainingPlans = this.trainingPlans.map((current) =>
      current.id === trainingPlan.id ? trainingPlan : current,
    );
  }

  async saveItem(item: TrainingPlanItem): Promise<void> {
    this.items.push(item);
  }
}

class FakeAuditLogger implements AuditLogger {
  records: AuditLogInput[] = [];

  async record(input: AuditLogInput): Promise<void> {
    this.records.push(input);
  }
}

const organizationId = '11111111-1111-4111-8111-111111111111';
const actorUserId = '22222222-2222-4222-8222-222222222222';

describe('Training Plans module', () => {
  it('validates create training plan input', () => {
    expect(() =>
      createTrainingPlanSchema.parse({
        organizationId,
        name: 'PAC 2026',
        year: 2026,
        budgetAmount: 1_000_000,
      }),
    ).not.toThrow();
  });

  it('creates a training plan in DRAFT status', async () => {
    const repository = new FakeTrainingPlanRepository();
    const auditLogger = new FakeAuditLogger();
    const result = await new CreateTrainingPlanUseCase(repository, auditLogger).execute(
      {
        organizationId,
        name: 'PAC 2026',
        year: 2026,
        budgetAmount: 1_000_000,
      },
      { organizationId, actorUserId },
    );

    expect(result.status satisfies TrainingPlanStatus).toBe('DRAFT');
    expect(result.organizationId).toBe(organizationId);
    expect(auditLogger.records[0]?.action).toBe('TRAINING_PLAN_CREATED');
  });

  it('prevents duplicate training plans for the same organization and year', async () => {
    const repository = new FakeTrainingPlanRepository();
    const useCase = new CreateTrainingPlanUseCase(repository);

    await useCase.execute({
      organizationId,
      name: 'PAC 2026',
      year: 2026,
      budgetAmount: 1_000_000,
    });

    await expect(
      useCase.execute({
        organizationId,
        name: 'PAC 2026 Copy',
        year: 2026,
        budgetAmount: 2_000_000,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('approves a training plan and records audit', async () => {
    const repository = new FakeTrainingPlanRepository();
    const auditLogger = new FakeAuditLogger();
    const created = await new CreateTrainingPlanUseCase(repository).execute({
      organizationId,
      name: 'PAC 2026',
      year: 2026,
      budgetAmount: 1_000_000,
    });

    const approved = await new ApproveTrainingPlanUseCase(repository, auditLogger).execute(
      created.id,
      { organizationId, actorUserId },
    );

    expect(approved.status).toBe('APPROVED');
    expect(auditLogger.records[0]?.action).toBe('TRAINING_PLAN_APPROVED');
  });

  it('creates a training plan item with course reference', async () => {
    const repository = new FakeTrainingPlanRepository();
    const created = await new CreateTrainingPlanUseCase(repository).execute({
      organizationId,
      name: 'PAC 2026',
      year: 2026,
      budgetAmount: 1_000_000,
    });
    const input = createTrainingPlanItemSchema.parse({
      courseId: '33333333-3333-4333-8333-333333333333',
      plannedMonth: 5,
      estimatedParticipants: 25,
      estimatedCost: 500_000,
      targetCompetencies: ['safety'],
    });

    const item = await new CreateTrainingPlanItemUseCase(repository).execute(
      created.id,
      input,
      { organizationId, actorUserId },
    );

    expect(item.trainingPlanId).toBe(created.id);
    expect(item.estimatedParticipants).toBe(25);
    expect(item.targetCompetencies).toEqual(['safety']);
  });
});
