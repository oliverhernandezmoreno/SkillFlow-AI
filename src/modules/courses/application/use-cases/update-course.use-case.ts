import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { CourseRepository } from '../../domain/repositories/course.repository.js';
import type { CourseDto, UpdateCourseDto } from '../dto/course.dto.js';
import { CourseMapper } from '../mappers/course.mapper.js';

export class UpdateCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(id: string, input: UpdateCourseDto): Promise<CourseDto> {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    course.update({
      organizationId: input.organizationId,
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
