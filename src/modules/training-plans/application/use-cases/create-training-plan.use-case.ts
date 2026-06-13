import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ConflictError, ForbiddenError } from '../../../../shared/domain/errors.js';
import { TrainingPlan } from '../../domain/entities/training-plan.entity.js';
import type { TrainingPlanRepository } from '../../domain/repositories/training-plan.repository.js';
import type { CreateTrainingPlanDto, TrainingPlanDto } from '../dto/training-plan.dto.js';
import { TrainingPlanMapper } from '../mappers/training-plan.mapper.js';

export class CreateTrainingPlanUseCase {
  constructor(
    private readonly trainingPlanRepository: TrainingPlanRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    input: CreateTrainingPlanDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<TrainingPlanDto> {
    if (context.organizationId && context.organizationId !== input.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    const existing = await this.trainingPlanRepository.findByOrganizationYear(
      input.organizationId,
      input.year,
    );
    if (existing) {
      throw new ConflictError('Training plan already exists for organization and year');
    }

    const trainingPlan = TrainingPlan.create(input);
    await this.trainingPlanRepository.save(trainingPlan);
    const created = TrainingPlanMapper.toDto(trainingPlan);
    await this.auditLogger.record({
      organizationId: input.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'TrainingPlan',
      entityId: trainingPlan.id,
      action: 'TRAINING_PLAN_CREATED',
      metadata: { year: input.year },
      after: created,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return created;
  }
}
