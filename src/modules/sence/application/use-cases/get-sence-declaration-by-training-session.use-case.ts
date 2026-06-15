import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { SenceRepository } from '../../domain/repositories/sence.repository.js';
import type { SenceDeclarationDto } from '../dto/sence.dto.js';
import { SenceMapper } from '../mappers/sence.mapper.js';
import { requireOrganizationId } from './sence-use-case.helpers.js';

export class GetSenceDeclarationByTrainingSessionUseCase {
  constructor(private readonly repository: SenceRepository) {}

  async execute(
    trainingSessionId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<SenceDeclarationDto> {
    const organizationId = requireOrganizationId(context);
    const declaration = await this.repository.findByTrainingSession(organizationId, trainingSessionId);
    if (!declaration) {
      throw new NotFoundError('SENCE declaration not found');
    }
    return SenceMapper.toDto(declaration);
  }
}
