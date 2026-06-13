import type { PaginatedResult } from '../../../../shared/application/pagination.js';
import { createPagination } from '../../../../shared/application/pagination.js';
import type { CourseModality, CourseStatus } from '../../domain/entities/course.entity.js';
import type { CourseRepository } from '../../domain/repositories/course.repository.js';
import type { CourseDto } from '../dto/course.dto.js';
import { CourseMapper } from '../mappers/course.mapper.js';

export class ListCoursesUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(input: {
    organizationId: string;
    page?: number | undefined;
    pageSize?: number | undefined;
    search?: string | undefined;
    modality?: CourseModality | undefined;
    status?: CourseStatus | undefined;
  }): Promise<PaginatedResult<CourseDto>> {
    const result = await this.courseRepository.search(
      {
        organizationId: input.organizationId,
        search: input.search,
        modality: input.modality,
        status: input.status,
      },
      createPagination(input),
    );

    return { data: result.data.map(CourseMapper.toDto), meta: result.meta };
  }
}
