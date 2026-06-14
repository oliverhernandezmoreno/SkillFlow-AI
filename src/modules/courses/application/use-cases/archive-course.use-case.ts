import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { CourseRepository } from '../../domain/repositories/course.repository.js';

export class ArchiveCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(id: string, context: UseCaseContext = anonymousUseCaseContext): Promise<void> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    const course = await this.courseRepository.findById(id, context.organizationId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    course.archive();
    await this.courseRepository.update(course);
  }
}
