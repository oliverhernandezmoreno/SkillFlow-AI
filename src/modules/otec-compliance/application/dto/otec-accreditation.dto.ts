import type {
  OtecAccreditationProps,
  OtecAccreditationStatus,
} from '../../domain/entities/otec-accreditation.entity.js';

export type OtecAccreditationDto = OtecAccreditationProps;

export interface CreateOtecAccreditationDto {
  organizationId?: string;
  otecProfileId: string;
  accreditationType: string;
  accreditationNumber: string;
  status?: OtecAccreditationStatus;
  issuedAt?: Date | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  issuingAuthority?: string | null;
  source?: string | null;
  externalReference?: string | null;
  notes?: string | null;
}

export interface UpdateOtecAccreditationDto {
  expectedVersion: number;
  organizationId?: string;
  otecProfileId?: string;
  accreditationType?: string;
  accreditationNumber?: string;
  issuedAt?: Date | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  issuingAuthority?: string | null;
  source?: string | null;
  externalReference?: string | null;
  notes?: string | null;
}

export interface TransitionOtecAccreditationDto {
  expectedVersion: number;
  reason?: string;
}
