import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import type { EvaluationDto } from '../dto/evaluation.dto.js';
import { ListEvaluationsUseCase } from './list-evaluations.use-case.js';

export class ListSessionEvaluationsUseCase {
  constructor(private readonly evaluationRepository: EvaluationRepository) {}

  async execute(
    trainingSessionId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<{ data: EvaluationDto[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }
    return new ListEvaluationsUseCase(this.evaluationRepository).execute(
      { organizationId: context.organizationId, trainingSessionId },
      context,
    );
  }
}
