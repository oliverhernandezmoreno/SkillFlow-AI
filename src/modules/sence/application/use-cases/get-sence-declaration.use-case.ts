import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { SenceRepository } from '../../domain/repositories/sence.repository.js';
import type { SenceDeclarationDto } from '../dto/sence.dto.js';
import { SenceMapper } from '../mappers/sence.mapper.js';
import { loadSenceDeclaration, requireOrganizationId } from './sence-use-case.helpers.js';

export class GetSenceDeclarationUseCase {
  constructor(private readonly repository: SenceRepository) {}

  async execute(
    declarationId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<SenceDeclarationDto> {
    const organizationId = requireOrganizationId(context);
    const declaration = await loadSenceDeclaration({ repository: this.repository, declarationId, organizationId });
    return SenceMapper.toDto(declaration);
  }
}
