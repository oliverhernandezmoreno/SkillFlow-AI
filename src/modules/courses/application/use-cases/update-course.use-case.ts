import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { CourseRepository } from '../../domain/repositories/course.repository.js';
import type { CourseDto, UpdateCourseDto } from '../dto/course.dto.js';
import { CourseMapper } from '../mappers/course.mapper.js';

export class UpdateCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(
    id: string,
    input: UpdateCourseDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<CourseDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    const course = await this.courseRepository.findById(id, context.organizationId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (input.organizationId && input.organizationId !== context.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    course.update({
      organizationId: context.organizationId,
      code: input.code,
      name: input.name,
      description: input.description,
      modality: input.modality,
      durationHours: input.durationHours,
      competencies: input.competencyIds,
      status: input.status,
    });
    await this.courseRepository.update(course);

    return CourseMapper.toDto(course);
  }
}
