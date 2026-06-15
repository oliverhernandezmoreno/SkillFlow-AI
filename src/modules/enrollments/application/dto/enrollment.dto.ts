import type { EnrollmentStatus } from '../../domain/entities/enrollment.entity.js';

export interface EnrollmentDto {
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

export interface CreateEnrollmentDto {
  organizationId: string;
  trainingSessionId: string;
  employeeId: string;
}

export interface UpdateEnrollmentDto {
  status?: EnrollmentStatus | undefined;
  completionPercentage?: number | null | undefined;
  finalScore?: number | null | undefined;
  approved?: boolean | null | undefined;
}
