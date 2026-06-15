import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ForbiddenError } from '../../../../shared/domain/errors.js';
import { TrainingSession } from '../../domain/entities/training-session.entity.js';
import type { TrainingSessionRepository } from '../../domain/repositories/training-session.repository.js';
import type {
  CreateTrainingSessionDto,
  TrainingSessionDto,
} from '../dto/training-session.dto.js';
import { TrainingSessionMapper } from '../mappers/training-session.mapper.js';

export class CreateTrainingSessionUseCase {
  constructor(private readonly trainingSessionRepository: TrainingSessionRepository) {}

  async execute(
    input: CreateTrainingSessionDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<TrainingSessionDto> {
    if (context.organizationId && context.organizationId !== input.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    const trainingSession = TrainingSession.create(input);
    await this.trainingSessionRepository.save(trainingSession);

    return TrainingSessionMapper.toDto(trainingSession);
  }
}
