import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import { normalizeEmail } from '../../domain/entities/instructor.entity.js';
import type { InstructorRepository } from '../../domain/repositories/instructor.repository.js';
import type { InstructorDto, UpdateInstructorDto } from '../dto/instructor.dto.js';
import { InstructorMapper } from '../mappers/instructor.mapper.js';

export class UpdateInstructorUseCase {
  constructor(private readonly instructorRepository: InstructorRepository) {}

  async execute(
    id: string,
    input: UpdateInstructorDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<InstructorDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    const instructor = await this.instructorRepository.findById(id, context.organizationId);
    if (!instructor) {
      throw new NotFoundError('Instructor not found');
    }

    if (input.email) {
      const normalizedEmail = normalizeEmail(input.email);
      const existing = await this.instructorRepository.findByEmail(
        context.organizationId,
        normalizedEmail,
      );
      if (existing && existing.id !== id) {
        throw new ConflictError('Instructor email already exists in organization');
      }
    }

    instructor.update(input);
    await this.instructorRepository.update(instructor);

    return InstructorMapper.toDto(instructor);
  }
}
