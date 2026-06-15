import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { SenceRepository } from '../../domain/repositories/sence.repository.js';
import type { SenceDocumentListDto } from '../dto/sence.dto.js';
import { SenceMapper } from '../mappers/sence.mapper.js';
import { loadSenceDeclaration, requireOrganizationId } from './sence-use-case.helpers.js';

export class ListSenceDocumentsUseCase {
  constructor(private readonly repository: SenceRepository) {}

  async execute(
    declarationId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<SenceDocumentListDto> {
    const organizationId = requireOrganizationId(context);
    await loadSenceDeclaration({ repository: this.repository, declarationId, organizationId });
    const documents = await this.repository.listDocuments(organizationId, declarationId);
    return SenceMapper.toDocumentListDto(documents);
  }
}
