import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ConflictError, ForbiddenError } from '../../../../shared/domain/errors.js';
import { Course } from '../../domain/entities/course.entity.js';
import type { CourseRepository } from '../../domain/repositories/course.repository.js';
import type { CourseDto, CreateCourseDto } from '../dto/course.dto.js';
import { CourseMapper } from '../mappers/course.mapper.js';

export class CreateCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(
    input: CreateCourseDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<CourseDto> {
    if (context.organizationId && context.organizationId !== input.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    const existing = await this.courseRepository.findByCode(input.organizationId, input.code);
    if (existing) {
      throw new ConflictError('Course code already exists in organization');
    }

    const course = Course.create({
      organizationId: input.organizationId,
      code: input.code,
      name: input.name,
      description: input.description,
      modality: input.modality,
      durationHours: input.durationHours,
      competencies: input.competencyIds,
    });
    await this.courseRepository.save(course);

    return CourseMapper.toDto(course);
  }
}
