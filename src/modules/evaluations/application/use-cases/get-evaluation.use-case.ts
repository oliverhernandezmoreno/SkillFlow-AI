import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import type { EvaluationDto } from '../dto/evaluation.dto.js';
import { EvaluationMapper } from '../mappers/evaluation.mapper.js';

export class GetEvaluationUseCase {
  constructor(private readonly evaluationRepository: EvaluationRepository) {}

  async execute(
    evaluationId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<EvaluationDto> {
    if (!context.organizationId) {
      throw new NotFoundError('Evaluation not found');
    }
    const evaluation = await this.evaluationRepository.findById(evaluationId, context.organizationId);
    if (!evaluation) {
      throw new NotFoundError('Evaluation not found');
    }
    return EvaluationMapper.toDto(evaluation);
  }
}
