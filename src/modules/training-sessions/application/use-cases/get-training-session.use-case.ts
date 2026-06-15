import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { TrainingSessionRepository } from '../../domain/repositories/training-session.repository.js';
import type { TrainingSessionDto } from '../dto/training-session.dto.js';
import { TrainingSessionMapper } from '../mappers/training-session.mapper.js';

export class GetTrainingSessionUseCase {
  constructor(private readonly trainingSessionRepository: TrainingSessionRepository) {}

  async execute(
    id: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<TrainingSessionDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    const trainingSession = await this.trainingSessionRepository.findById(
      id,
      context.organizationId,
    );
    if (!trainingSession) {
      throw new NotFoundError('Training session not found');
    }

    return TrainingSessionMapper.toDto(trainingSession);
  }
}
