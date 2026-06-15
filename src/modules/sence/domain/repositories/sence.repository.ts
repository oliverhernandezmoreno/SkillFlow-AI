import type { PaginatedResult, PaginationInput } from '../../../../shared/application/pagination.js';
import type {
  SenceDeclaration,
  SenceDeclarationStatus,
} from '../entities/sence-declaration.entity.js';
import type { SenceDocument } from '../entities/sence-document.entity.js';

export interface SenceSearchFilters {
  organizationId: string;
  trainingSessionId?: string | undefined;
  courseId?: string | undefined;
  status?: SenceDeclarationStatus | undefined;
}

export interface SenceComplianceSnapshot {
  declaration: SenceDeclaration;
  trainingSession: {
    id: string;
    organizationId: string;
    courseId: string;
    instructorId: string | null;
    providerId: string | null;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
  } | null;
  course: {
    id: string;
    organizationId: string;
    code: string;
    name: string;
    modality: string;
    durationHours: number;
    status: string;
    senceCode: string | null;
  } | null;
  participants: SenceParticipantSnapshot[];
  documents: SenceDocument[];
}

export interface SenceParticipantSnapshot {
  enrollmentId: string;
  employeeId: string;
  enrollmentStatus: string;
  attendancePercentage: number | null;
  hasAttendance: boolean;
  hasCertificate: boolean;
  hasEvaluation: boolean;
  evaluationPassed: boolean | null;
  crossTenantIssue: boolean;
}

export interface SenceRepository {
  findById(id: string, organizationId: string): Promise<SenceDeclaration | null>;
  findByTrainingSession(
    organizationId: string,
    trainingSessionId: string,
  ): Promise<SenceDeclaration | null>;
  search(
    filters: SenceSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<SenceDeclaration>>;
  save(declaration: SenceDeclaration): Promise<void>;
  update(declaration: SenceDeclaration): Promise<void>;
  attachDocument(document: SenceDocument): Promise<void>;
  listDocuments(organizationId: string, declarationId: string): Promise<SenceDocument[]>;
  getComplianceSnapshot(
    organizationId: string,
    declarationId: string,
  ): Promise<SenceComplianceSnapshot | null>;
  documentExists(organizationId: string, documentId: string): Promise<boolean>;
}
