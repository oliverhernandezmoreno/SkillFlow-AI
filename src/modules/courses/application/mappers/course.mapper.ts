import type { Course } from '../../domain/entities/course.entity.js';
import type { CourseDto } from '../dto/course.dto.js';

export class CourseMapper {
  static toDto(course: Course): CourseDto {
    const props = course.toPrimitives();

    return {
      id: props.id,
      organizationId: props.organizationId,
      code: props.code,
      name: props.name,
      description: props.description,
      modality: props.modality,
      durationHours: props.durationHours,
      status: props.status,
      competencyIds: props.competencies,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
