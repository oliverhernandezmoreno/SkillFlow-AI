import {
  createPagination,
  type PaginatedResult,
} from '../../../../shared/application/pagination.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ForbiddenError } from '../../../../shared/domain/errors.js';
import type { InstructorStatus } from '../../domain/entities/instructor.entity.js';
import type { InstructorRepository } from '../../domain/repositories/instructor.repository.js';
import type { InstructorDto } from '../dto/instructor.dto.js';
import { InstructorMapper } from '../mappers/instructor.mapper.js';

export interface ListInstructorsInput {
  organizationId: string;
  page?: number | undefined;
  pageSize?: number | undefined;
  search?: string | undefined;
  status?: InstructorStatus | undefined;
  providerId?: string | undefined;
}

export class ListInstructorsUseCase {
  constructor(private readonly instructorRepository: InstructorRepository) {}

  async execute(
    input: ListInstructorsInput,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<PaginatedResult<InstructorDto>> {
    if (context.organizationId && context.organizationId !== input.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    const result = await this.instructorRepository.search(
      {
        organizationId: input.organizationId,
        search: input.search,
        status: input.status,
        providerId: input.providerId,
      },
      createPagination(input),
    );

    return { data: result.data.map(InstructorMapper.toDto), meta: result.meta };
  }
}
