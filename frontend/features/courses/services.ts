import { apiRequest } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-params';
import type { Course, CourseInput, ListFilters, PaginatedResponse } from '@/types/resources';

export interface CourseFilters extends ListFilters {
  modality?: string;
}

export function listCourses(filters: CourseFilters = {}) {
  return apiRequest<PaginatedResponse<Course>>(`/courses${toQueryString(filters)}`);
}

export function createCourse(input: CourseInput) {
  return apiRequest<Course>('/courses', {
    method: 'POST',
    body: input,
  });
}

export function updateCourse(courseId: string, input: Partial<CourseInput>) {
  return apiRequest<Course>(`/courses/${courseId}`, {
    method: 'PATCH',
    body: input,
  });
}
