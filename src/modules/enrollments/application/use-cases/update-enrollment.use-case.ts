import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { EnrollmentRepository } from '../../domain/repositories/enrollment.repository.js';
import type { EnrollmentDto, UpdateEnrollmentDto } from '../dto/enrollment.dto.js';
import { EnrollmentMapper } from '../mappers/enrollment.mapper.js';

export class UpdateEnrollmentUseCase {
  constructor(private readonly enrollmentRepository: EnrollmentRepository) {}

  async execute(
    id: string,
    input: UpdateEnrollmentDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<EnrollmentDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    const enrollment = await this.enrollmentRepository.findById(id, context.organizationId);
    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    enrollment.update(input);
    await this.enrollmentRepository.update(enrollment);

    return EnrollmentMapper.toDto(enrollment);
  }
}
