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
  trainingSessionId?: string;
  employeeId?: string;
  enrollmentId?: string;
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
  trainingPlanItemId?: string | null;
  name: string;
  providerId?: string | null;
  instructorId?: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  capacity: number;
  costAmount?: number | null;
  meetingUrl?: string | null;
  status: TrainingSessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSessionInput {
  organizationId: string;
  courseId: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string | null;
  capacity: number;
  costAmount?: number | null;
  meetingUrl?: string | null;
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

export interface EnrollmentInput {
  organizationId: string;
  trainingSessionId: string;
  employeeId: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'INCOMPLETE';
export type AttendanceMethod = 'QR' | 'DIGITAL_SIGNATURE' | 'MANUAL' | 'BIOMETRIC';

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  enrollmentId: string;
  trainingSessionId: string;
  employeeId: string;
  method: AttendanceMethod;
  status: AttendanceStatus;
  attendancePercentage?: number | null;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceInput {
  organizationId: string;
  enrollmentId: string;
  trainingSessionId: string;
  employeeId: string;
  method?: AttendanceMethod;
  status: AttendanceStatus;
}

export type EvaluationStatus = 'OPEN' | 'CLOSED';
export type EvaluationType =
  | 'KNOWLEDGE'
  | 'KNOWLEDGE_TEST'
  | 'SATISFACTION'
  | 'SATISFACTION_SURVEY'
  | 'PRACTICAL'
  | 'PRACTICAL_ASSESSMENT'
  | 'DIAGNOSTIC';

export interface Evaluation {
  id: string;
  organizationId: string;
  trainingSessionId: string;
  type: EvaluationType;
  title: string;
  description: string | null;
  passingScore: number | null;
  status: EvaluationStatus;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationInput {
  organizationId: string;
  trainingSessionId: string;
  type: EvaluationType;
  title: string;
  description?: string | null;
  passingScore?: number | null;
}

export type CertificateStatus = 'DRAFT' | 'ISSUED' | 'REVOKED' | 'EXPIRED';

export interface Certificate {
  id: string;
  organizationId: string;
  enrollmentId: string | null;
  employeeId: string;
  courseId: string;
  trainingSessionId: string;
  certificateNumber: string;
  verificationCode: string;
  status: CertificateStatus;
  issuedAt: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IssueCertificateInput {
  enrollmentId: string;
  expiresAt?: string | null;
}

export type SenceDeclarationStatus = 'DRAFT' | 'READY' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'OBSERVED';

export interface SenceDeclaration {
  id: string;
  organizationId: string;
  trainingSessionId: string;
  senceCode?: string | null;
  status: SenceDeclarationStatus;
  declaredAmount?: number | null;
  taxCreditAmount?: number | null;
  externalCode?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SenceDeclarationInput {
  trainingSessionId: string;
  senceCode?: string | null;
  declaredAmount?: number | null;
  taxCreditAmount?: number | null;
}

export interface TrainingPlan {
  id: string;
  organizationId: string;
  name: string;
  year: number;
  status: string;
  budgetAmount?: number | null;
  createdAt: string;
  updatedAt: string;
}
