import type { PaginatedResult } from '../../../../shared/application/pagination.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { EnrollmentRepository } from '../../domain/repositories/enrollment.repository.js';
import type { EnrollmentDto } from '../dto/enrollment.dto.js';
import { ListEnrollmentsUseCase } from './list-enrollments.use-case.js';

export class ListSessionEnrollmentsUseCase {
  constructor(private readonly enrollmentRepository: EnrollmentRepository) {}

  async execute(
    trainingSessionId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<PaginatedResult<EnrollmentDto>> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    return new ListEnrollmentsUseCase(this.enrollmentRepository).execute(
      { organizationId: context.organizationId, trainingSessionId },
      context,
    );
  }
}
