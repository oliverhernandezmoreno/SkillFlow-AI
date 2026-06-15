import {
  createPagination,
  type PaginatedResult,
} from '../../../../shared/application/pagination.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ForbiddenError } from '../../../../shared/domain/errors.js';
import type { EnrollmentStatus } from '../../domain/entities/enrollment.entity.js';
import type { EnrollmentRepository } from '../../domain/repositories/enrollment.repository.js';
import type { EnrollmentDto } from '../dto/enrollment.dto.js';
import { EnrollmentMapper } from '../mappers/enrollment.mapper.js';

export interface ListEnrollmentsInput {
  organizationId: string;
  page?: number | undefined;
  pageSize?: number | undefined;
  trainingSessionId?: string | undefined;
  employeeId?: string | undefined;
  status?: EnrollmentStatus | undefined;
}

export class ListEnrollmentsUseCase {
  constructor(private readonly enrollmentRepository: EnrollmentRepository) {}

  async execute(
    input: ListEnrollmentsInput,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<PaginatedResult<EnrollmentDto>> {
    if (context.organizationId && context.organizationId !== input.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    const result = await this.enrollmentRepository.search(
      {
        organizationId: input.organizationId,
        trainingSessionId: input.trainingSessionId,
        employeeId: input.employeeId,
        status: input.status,
      },
      createPagination(input),
    );

    return { data: result.data.map(EnrollmentMapper.toDto), meta: result.meta };
  }
}
