import type { SenceDeclarationStatus } from '../../domain/entities/sence-declaration.entity.js';

export interface CreateSenceDeclarationDto {
  trainingSessionId: string;
  senceCode?: string | null | undefined;
  declaredAmount?: number | null | undefined;
  taxCreditAmount?: number | null | undefined;
  externalCode?: string | null | undefined;
}

export interface UpdateSenceDeclarationDto {
  senceCode?: string | null | undefined;
  declaredAmount?: number | null | undefined;
  taxCreditAmount?: number | null | undefined;
  externalCode?: string | null | undefined;
}

export interface SubmitSenceDeclarationDto {
  comments?: string | null | undefined;
}

export interface UpdateSenceStatusDto {
  status: 'ACCEPTED' | 'REJECTED' | 'OBSERVED';
  reason?: string | null | undefined;
  comments?: string | null | undefined;
}

export interface AttachSenceDocumentDto {
  documentId: string;
  documentType?: string | null | undefined;
}

export interface SenceDeclarationDto {
  id: string;
  organizationId: string;
  trainingSessionId: string;
  senceCode: string | null;
  status: SenceDeclarationStatus;
  declaredAmount: number | null;
  taxCreditAmount: number | null;
  externalCode: string | null;
  submittedAt: string | null;
  responsePayload: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SenceDeclarationListDto {
  data: SenceDeclarationDto[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface SenceComplianceValidationDto {
  valid: boolean;
  statusSuggestion: 'DRAFT' | 'READY';
  errors: string[];
  warnings: string[];
  participantCount: number;
  participantsWithAttendance: number;
  participantsWithCertificates: number;
  participantsWithEvaluation: number;
  averageAttendancePercentage: number | null;
  missingEvidence: string[];
  crossTenantIssues: string[];
}

export interface SenceEvidenceItemDto {
  type: string;
  metadata: Record<string, unknown>;
}

export interface SenceEvidenceDto {
  declarationId: string;
  trainingSessionId: string;
  evidence: SenceEvidenceItemDto[];
}

export interface SenceDocumentDto {
  id: string;
  organizationId: string;
  senceDeclarationId: string;
  documentId: string;
  documentType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SenceDocumentListDto {
  data: SenceDocumentDto[];
}
