import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { TrainingPlanItem } from '../../domain/entities/training-plan-item.entity.js';
import type { TrainingPlanRepository } from '../../domain/repositories/training-plan.repository.js';
import type { CreateTrainingPlanItemDto, TrainingPlanItemDto } from '../dto/training-plan.dto.js';
import { TrainingPlanMapper } from '../mappers/training-plan.mapper.js';

export class CreateTrainingPlanItemUseCase {
  constructor(private readonly trainingPlanRepository: TrainingPlanRepository) {}

  async execute(
    trainingPlanId: string,
    input: CreateTrainingPlanItemDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<TrainingPlanItemDto> {
    const trainingPlan = await this.trainingPlanRepository.findById(trainingPlanId);
    if (!trainingPlan) {
      throw new NotFoundError('Training plan not found');
    }
    const planProps = trainingPlan.toPrimitives();
    if (context.organizationId && planProps.organizationId !== context.organizationId) {
      throw new NotFoundError('Training plan not found');
    }

    const item = TrainingPlanItem.create({
      organizationId: planProps.organizationId,
      trainingPlanId,
      courseId: input.courseId,
      plannedMonth: input.plannedMonth,
      quarter: input.quarter,
      estimatedParticipants: input.estimatedParticipants,
      estimatedCost: input.estimatedCost,
      priority: input.priority,
      businessJustification: input.businessJustification,
      targetCompetencies: input.targetCompetencies,
    });
    await this.trainingPlanRepository.saveItem(item);

    return TrainingPlanMapper.itemToDto(item);
  }
}
