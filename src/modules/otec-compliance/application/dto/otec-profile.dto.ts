import type { OtecProfileProps } from '../../domain/entities/otec-profile.entity.js';

export type OtecProfileDto = OtecProfileProps;

export interface CreateOtecProfileDto {
  registrationCode?: string | null;
  rudoReference?: string | null;
  technicalContactName?: string | null;
  technicalContactEmail?: string | null;
  technicalContactPhone?: string | null;
  notes?: string | null;
}

export interface UpdateOtecProfileDto extends CreateOtecProfileDto {
  expectedVersion: number;
}

export interface DeactivateOtecProfileDto {
  expectedVersion: number;
}
