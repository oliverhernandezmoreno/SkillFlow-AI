import type { PaginatedResult } from '../../../../shared/application/pagination.js';
import { createPagination } from '../../../../shared/application/pagination.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ForbiddenError } from '../../../../shared/domain/errors.js';
import type { TrainingPlanStatus } from '../../domain/entities/training-plan.entity.js';
import type { TrainingPlanRepository } from '../../domain/repositories/training-plan.repository.js';
import type { TrainingPlanDto } from '../dto/training-plan.dto.js';
import { TrainingPlanMapper } from '../mappers/training-plan.mapper.js';

export class ListTrainingPlansUseCase {
  constructor(private readonly trainingPlanRepository: TrainingPlanRepository) {}

  async execute(
    input: {
      organizationId: string;
      year?: number | undefined;
      status?: TrainingPlanStatus | undefined;
      page?: number | undefined;
      pageSize?: number | undefined;
    },
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<PaginatedResult<TrainingPlanDto>> {
    if (context.organizationId && context.organizationId !== input.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    const result = await this.trainingPlanRepository.search(
      {
        organizationId: input.organizationId,
        year: input.year,
        status: input.status,
      },
      createPagination(input),
    );

    return {
      data: result.data.map(TrainingPlanMapper.toDto),
      meta: result.meta,
    };
  }
}
