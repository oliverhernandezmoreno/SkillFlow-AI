import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { EnrollmentRepository } from '../../domain/repositories/enrollment.repository.js';
import type { EnrollmentDto } from '../dto/enrollment.dto.js';
import { EnrollmentMapper } from '../mappers/enrollment.mapper.js';

export class GetEnrollmentUseCase {
  constructor(private readonly enrollmentRepository: EnrollmentRepository) {}

  async execute(id: string, context: UseCaseContext = anonymousUseCaseContext): Promise<EnrollmentDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    const enrollment = await this.enrollmentRepository.findById(id, context.organizationId);
    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    return EnrollmentMapper.toDto(enrollment);
  }
}
