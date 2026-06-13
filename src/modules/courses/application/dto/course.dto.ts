import type { CourseModality, CourseStatus } from '../../domain/entities/course.entity.js';

export interface CourseDto {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string;
  modality: CourseModality;
  durationHours: number;
  status: CourseStatus;
  competencyIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  organizationId: string;
  code: string;
  name: string;
  description?: string | undefined;
  modality: CourseModality;
  durationHours: number;
  competencyIds?: string[] | undefined;
}

export type UpdateCourseDto = Partial<CreateCourseDto> & { status?: CourseStatus | undefined };
