import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ConflictError, ForbiddenError } from '../../../../shared/domain/errors.js';
import { Instructor, normalizeEmail } from '../../domain/entities/instructor.entity.js';
import type { InstructorRepository } from '../../domain/repositories/instructor.repository.js';
import type { CreateInstructorDto, InstructorDto } from '../dto/instructor.dto.js';
import { InstructorMapper } from '../mappers/instructor.mapper.js';

export class CreateInstructorUseCase {
  constructor(private readonly instructorRepository: InstructorRepository) {}

  async execute(
    input: CreateInstructorDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<InstructorDto> {
    if (context.organizationId && context.organizationId !== input.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    if (input.email) {
      const existing = await this.instructorRepository.findByEmail(
        input.organizationId,
        normalizeEmail(input.email),
      );
      if (existing) {
        throw new ConflictError('Instructor email already exists in organization');
      }
    }

    const instructor = Instructor.create(input);
    await this.instructorRepository.save(instructor);

    return InstructorMapper.toDto(instructor);
  }
}
