import type { QualityCertificationProps } from '../../domain/entities/quality-certification.entity.js';

export type QualityCertificationDto = QualityCertificationProps;
export interface CreateQualityCertificationDto {
  organizationId?: string;
  otecProfileId: string;
  certificationType: string;
  certificationNumber: string;
  certifyingEntity: string;
  scope?: string | null;
  issuedAt?: Date | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  documentId?: string | null;
  notes?: string | null;
}
export interface UpdateQualityCertificationDto {
  expectedVersion: number;
  organizationId?: string;
  otecProfileId?: string;
  certificationType?: string;
  certificationNumber?: string;
  certifyingEntity?: string;
  scope?: string | null;
  issuedAt?: Date | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  documentId?: string | null;
  notes?: string | null;
}
export interface DeactivateQualityCertificationDto {
  expectedVersion: number;
}
