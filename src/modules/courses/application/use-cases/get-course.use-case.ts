import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { CourseRepository } from '../../domain/repositories/course.repository.js';
import type { CourseDto } from '../dto/course.dto.js';
import { CourseMapper } from '../mappers/course.mapper.js';

export class GetCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(id: string, context: UseCaseContext = anonymousUseCaseContext): Promise<CourseDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    const course = await this.courseRepository.findById(id, context.organizationId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    return CourseMapper.toDto(course);
  }
}
