import { createPagination } from '../../../../shared/application/pagination.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ForbiddenError } from '../../../../shared/domain/errors.js';
import type { EvaluationType } from '../../domain/entities/evaluation.entity.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import type { EvaluationDto } from '../dto/evaluation.dto.js';
import { EvaluationMapper } from '../mappers/evaluation.mapper.js';

export interface ListEvaluationsInput {
  organizationId: string;
  page?: number | undefined;
  pageSize?: number | undefined;
  trainingSessionId?: string | undefined;
  enrollmentId?: string | undefined;
  employeeId?: string | undefined;
  type?: EvaluationType | undefined;
}

export class ListEvaluationsUseCase {
  constructor(private readonly evaluationRepository: EvaluationRepository) {}

  async execute(
    input: ListEvaluationsInput,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<{ data: EvaluationDto[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }> {
    if (context.organizationId && context.organizationId !== input.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    const result = await this.evaluationRepository.search(
      {
        organizationId: input.organizationId,
        trainingSessionId: input.trainingSessionId,
        enrollmentId: input.enrollmentId,
        employeeId: input.employeeId,
        type: input.type,
      },
      createPagination({ page: input.page, pageSize: input.pageSize }),
    );

    return { data: result.data.map(EvaluationMapper.toDto), meta: result.meta };
  }
}
