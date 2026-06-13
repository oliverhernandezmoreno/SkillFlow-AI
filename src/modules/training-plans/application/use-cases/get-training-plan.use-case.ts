import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { TrainingPlanRepository } from '../../domain/repositories/training-plan.repository.js';
import type { TrainingPlanDto } from '../dto/training-plan.dto.js';
import { TrainingPlanMapper } from '../mappers/training-plan.mapper.js';

export class GetTrainingPlanUseCase {
  constructor(private readonly trainingPlanRepository: TrainingPlanRepository) {}

  async execute(
    id: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<TrainingPlanDto> {
    const trainingPlan = await this.trainingPlanRepository.findById(id);
    if (!trainingPlan) {
      throw new NotFoundError('Training plan not found');
    }

    const dto = TrainingPlanMapper.toDto(trainingPlan);
    if (context.organizationId && dto.organizationId !== context.organizationId) {
      throw new NotFoundError('Training plan not found');
    }

    return dto;
  }
}
