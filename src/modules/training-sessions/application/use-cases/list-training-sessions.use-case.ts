import {
  createPagination,
  type PaginatedResult,
} from '../../../../shared/application/pagination.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ForbiddenError } from '../../../../shared/domain/errors.js';
import type { TrainingSessionStatus } from '../../domain/entities/training-session.entity.js';
import type { TrainingSessionRepository } from '../../domain/repositories/training-session.repository.js';
import type { TrainingSessionDto } from '../dto/training-session.dto.js';
import { TrainingSessionMapper } from '../mappers/training-session.mapper.js';

export interface ListTrainingSessionsInput {
  organizationId: string;
  page?: number | undefined;
  pageSize?: number | undefined;
  courseId?: string | undefined;
  status?: TrainingSessionStatus | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
}

export class ListTrainingSessionsUseCase {
  constructor(private readonly trainingSessionRepository: TrainingSessionRepository) {}

  async execute(
    input: ListTrainingSessionsInput,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<PaginatedResult<TrainingSessionDto>> {
    if (context.organizationId && context.organizationId !== input.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    const result = await this.trainingSessionRepository.search(
      {
        organizationId: input.organizationId,
        courseId: input.courseId,
        status: input.status,
        from: input.from,
        to: input.to,
      },
      createPagination(input),
    );

    return { data: result.data.map(TrainingSessionMapper.toDto), meta: result.meta };
  }
}
