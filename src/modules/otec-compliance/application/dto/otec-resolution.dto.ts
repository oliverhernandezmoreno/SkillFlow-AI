import type {
  OtecResolutionStatus,
  OtecResolutionType,
} from '../../domain/entities/otec-resolution.entity.js';
export interface OtecResolutionDto {
  id: string;
  organizationId: string;
  otecProfileId: string;
  resolutionType: OtecResolutionType;
  resolutionNumber: string;
  issuingAuthority: string;
  issuedAt: Date;
  validFrom: Date | null;
  validUntil: Date | null;
  status: OtecResolutionStatus;
  scope: string | null;
  supersedesResolutionId: string | null;
  documentId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}
export interface CreateOtecResolutionDto {
  organizationId?: string;
  otecProfileId: string;
  resolutionType: string;
  resolutionNumber: string;
  issuingAuthority: string;
  issuedAt: Date;
  validFrom?: Date | null;
  validUntil?: Date | null;
  scope?: string | null;
  documentId?: string | null;
  notes?: string | null;
}
export interface UpdateOtecResolutionDto {
  expectedVersion: number;
  organizationId?: string;
  otecProfileId?: string;
  supersedesResolutionId?: string | null;
  resolutionType?: string;
  resolutionNumber?: string;
  issuingAuthority?: string;
  issuedAt?: Date;
  validFrom?: Date | null;
  validUntil?: Date | null;
  scope?: string | null;
  documentId?: string | null;
  notes?: string | null;
}
export interface SupersedeOtecResolutionDto {
  replacedResolutionId: string;
  replacementResolutionId: string;
  replacedExpectedVersion: number;
  replacementExpectedVersion: number;
  reason?: string;
}
export interface SupersedeOtecResolutionResult {
  replaced: OtecResolutionDto;
  replacement: OtecResolutionDto;
}
export interface DeactivateOtecResolutionDto {
  expectedVersion: number;
  reason?: string;
}
