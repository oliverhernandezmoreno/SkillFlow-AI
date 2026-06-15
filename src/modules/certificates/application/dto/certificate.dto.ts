import type { CertificateStatus } from '../../domain/entities/certificate.entity.js';

export interface CertificateDto {
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
  expiresAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  fileUrl: string | null;
  documentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateListDto {
  data: CertificateDto[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface IssueCertificateDto {
  enrollmentId: string;
  expiresAt?: string | null | undefined;
}

export interface RevokeCertificateDto {
  reason: string;
}

export interface CertificateEligibilityDto {
  eligible: boolean;
  reasons: string[];
  attendancePercentage: number | null;
  minimumAttendancePercentage: number;
  evaluationRequired: boolean;
  evaluationPassed: boolean | null;
  evaluationScore: number | null;
  enrollmentStatus: string | null;
  courseId: string | null;
  employeeId: string | null;
  trainingSessionId: string | null;
}

export interface CertificateVerificationDto {
  valid: boolean;
  status: CertificateStatus | null;
  certificateNumber: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  courseId: string | null;
  trainingSessionId: string | null;
}

export interface CertificateDocumentDto {
  id: string;
  certificateId: string;
  fileName: string;
  fileUrl: string | null;
  mimeType: string | null;
  storageKey: string | null;
  status: 'GENERATED';
}
