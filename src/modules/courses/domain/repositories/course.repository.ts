import type { PaginatedResult, PaginationInput } from '../../../../shared/application/pagination.js';
import type { Course, CourseModality, CourseStatus } from '../entities/course.entity.js';

export interface CourseSearchFilters {
  organizationId: string;
  search?: string | undefined;
  modality?: CourseModality | undefined;
  status?: CourseStatus | undefined;
}

export interface CourseRepository {
  findById(id: string): Promise<Course | null>;
  findByCode(organizationId: string, code: string): Promise<Course | null>;
  search(filters: CourseSearchFilters, pagination: PaginationInput): Promise<PaginatedResult<Course>>;
  save(course: Course): Promise<void>;
  update(course: Course): Promise<void>;
}
