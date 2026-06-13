import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { CourseRepository } from '../../domain/repositories/course.repository.js';
import type { CourseDto } from '../dto/course.dto.js';
import { CourseMapper } from '../mappers/course.mapper.js';

export class GetCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(id: string): Promise<CourseDto> {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    return CourseMapper.toDto(course);
  }
}
