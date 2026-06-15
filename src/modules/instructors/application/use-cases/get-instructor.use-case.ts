import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { InstructorRepository } from '../../domain/repositories/instructor.repository.js';
import type { InstructorDto } from '../dto/instructor.dto.js';
import { InstructorMapper } from '../mappers/instructor.mapper.js';

export class GetInstructorUseCase {
  constructor(private readonly instructorRepository: InstructorRepository) {}

  async execute(
    id: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<InstructorDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    const instructor = await this.instructorRepository.findById(id, context.organizationId);
    if (!instructor) {
      throw new NotFoundError('Instructor not found');
    }

    return InstructorMapper.toDto(instructor);
  }
}
