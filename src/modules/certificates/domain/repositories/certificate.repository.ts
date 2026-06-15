import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../shared/application/pagination.js';
import type { Certificate, CertificateStatus } from '../entities/certificate.entity.js';

export interface CertificateSearchFilters {
  organizationId: string;
  employeeId?: string | undefined;
  enrollmentId?: string | undefined;
  trainingSessionId?: string | undefined;
  status?: CertificateStatus | undefined;
}

export interface CertificateEligibilitySnapshot {
  enrollment: {
    id: string;
    organizationId: string;
    trainingSessionId: string;
    employeeId: string;
    status: string;
  } | null;
  employee: {
    id: string;
    organizationId: string;
    firstName: string;
    lastName: string;
  } | null;
  trainingSession: {
    id: string;
    organizationId: string;
    courseId: string;
    startDate: Date;
    endDate: Date;
  } | null;
  course: {
    id: string;
    organizationId: string;
    code: string;
    name: string;
    validityMonths: number | null;
  } | null;
  attendance: {
    id: string;
    organizationId: string;
    enrollmentId: string;
    trainingSessionId: string;
    employeeId: string;
    checkInAt: Date | null;
    checkOutAt: Date | null;
  } | null;
  evaluations: {
    id: string;
    closedAt: Date | null;
    response: {
      score: number | null;
      passed: boolean | null;
    } | null;
  }[];
  existingCertificate: Certificate | null;
}

export interface CertificateDocumentSnapshot {
  id: string;
  organizationId: string;
  fileName: string;
  fileUrl: string | null;
  mimeType: string | null;
  storageKey: string | null;
}

export interface CertificateRepository {
  findById(id: string, organizationId: string): Promise<Certificate | null>;
  findByEnrollment(organizationId: string, enrollmentId: string): Promise<Certificate | null>;
  findByVerificationCode(verificationCode: string): Promise<Certificate | null>;
  search(
    filters: CertificateSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Certificate>>;
  save(certificate: Certificate): Promise<void>;
  update(certificate: Certificate): Promise<void>;
  countIssuedByOrganizationAndYear(organizationId: string, year: number): Promise<number>;
  getEligibilitySnapshot(
    organizationId: string,
    enrollmentId: string,
  ): Promise<CertificateEligibilitySnapshot>;
  createDocumentForCertificate(input: {
    organizationId: string;
    certificateId: string;
    fileName: string;
    mimeType: string;
    actorUserId: string | null;
  }): Promise<CertificateDocumentSnapshot>;
}
