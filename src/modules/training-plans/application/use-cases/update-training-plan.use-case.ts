import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { TrainingPlanRepository } from '../../domain/repositories/training-plan.repository.js';
import type { TrainingPlanDto, UpdateTrainingPlanDto } from '../dto/training-plan.dto.js';
import { TrainingPlanMapper } from '../mappers/training-plan.mapper.js';

export class UpdateTrainingPlanUseCase {
  constructor(
    private readonly trainingPlanRepository: TrainingPlanRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    id: string,
    input: UpdateTrainingPlanDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<TrainingPlanDto> {
    const trainingPlan = await this.trainingPlanRepository.findById(id);
    if (!trainingPlan) {
      throw new NotFoundError('Training plan not found');
    }
    const before = TrainingPlanMapper.toDto(trainingPlan);
    if (context.organizationId && before.organizationId !== context.organizationId) {
      throw new NotFoundError('Training plan not found');
    }

    trainingPlan.update(input);
    await this.trainingPlanRepository.update(trainingPlan);
    const after = TrainingPlanMapper.toDto(trainingPlan);
    await this.auditLogger.record({
      organizationId: after.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'TrainingPlan',
      entityId: id,
      action: 'TRAINING_PLAN_UPDATED',
      metadata: {},
      before,
      after,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return after;
  }
}
