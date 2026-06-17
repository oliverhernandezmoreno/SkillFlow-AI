export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<TData> {
  data: TData[];
  meta: PaginationMeta;
}

export interface ListFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  organizationId?: string;
  status?: string;
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';

export interface Employee {
  id: string;
  organizationId: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  positionName: string;
  areaName: string;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeInput {
  organizationId: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  positionName?: string;
  areaName?: string;
}

export type CourseModality = 'PRESENTIAL' | 'ONLINE' | 'HYBRID' | 'BLENDED' | 'ASYNC';
export type CourseStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface Course {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string;
  modality: CourseModality;
  durationHours: number;
  status: CourseStatus;
  competencyIds?: string[];
  competencies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseInput {
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  modality: CourseModality;
  durationHours: number;
  competencyIds?: string[];
}

export type TrainingSessionStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CLOSED';

export interface TrainingSession {
  id: string;
  organizationId: string;
  courseId: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string | null;
  capacity: number;
  status: TrainingSessionStatus;
  createdAt: string;
  updatedAt: string;
}

export type EnrollmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'WAITLISTED'
  | 'ENROLLED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'FAILED';

export interface Enrollment {
  id: string;
  organizationId: string;
  trainingSessionId: string;
  employeeId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completionPercentage: number | null;
  finalScore: number | null;
  approved: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  trainingSessionId: string;
  employeeId: string;
  status: string;
  attendancePercentage?: number | null;
}

export interface Certificate {
  id: string;
  status: string;
  employeeId?: string;
  enrollmentId?: string;
  trainingSessionId?: string;
}

export interface SenceDeclaration {
  id: string;
  trainingSessionId: string;
  status: string;
  declaredAmount?: number | null;
  taxCreditAmount?: number | null;
}
