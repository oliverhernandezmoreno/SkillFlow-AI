import { createPagination } from '../../../../shared/application/pagination.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { SenceDeclarationStatus } from '../../domain/entities/sence-declaration.entity.js';
import type { SenceRepository } from '../../domain/repositories/sence.repository.js';
import type { SenceDeclarationListDto } from '../dto/sence.dto.js';
import { SenceMapper } from '../mappers/sence.mapper.js';
import { requireOrganizationId } from './sence-use-case.helpers.js';

export class ListSenceDeclarationsUseCase {
  constructor(private readonly repository: SenceRepository) {}

  async execute(
    input: {
      page?: number | undefined;
      pageSize?: number | undefined;
      trainingSessionId?: string | undefined;
      courseId?: string | undefined;
      status?: SenceDeclarationStatus | undefined;
    },
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<SenceDeclarationListDto> {
    const organizationId = requireOrganizationId(context);
    const result = await this.repository.search(
      {
        organizationId,
        trainingSessionId: input.trainingSessionId,
        courseId: input.courseId,
        status: input.status,
      },
      createPagination(input),
    );
    return SenceMapper.toListDto(result);
  }
}
