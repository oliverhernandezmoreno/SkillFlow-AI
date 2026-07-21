import type { OtecOfficeStatus, OtecOfficeType } from '../../domain/entities/otec-office.entity.js';
export interface OtecOfficeDto {
  id: string;
  organizationId: string;
  otecProfileId: string;
  officeCode: string;
  name: string;
  officeType: OtecOfficeType;
  status: OtecOfficeStatus;
  street: string;
  city: string;
  commune: string;
  region: string;
  country: string;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}
export interface CreateOtecOfficeDto {
  organizationId?: string;
  otecProfileId: string;
  officeCode: string;
  name: string;
  officeType: string;
  street: string;
  city: string;
  commune: string;
  region: string;
  country: string;
  postalCode?: string | null;
  email?: string | null;
  phone?: string | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  notes?: string | null;
}
export interface UpdateOtecOfficeDto {
  expectedVersion: number;
  organizationId?: string;
  otecProfileId?: string;
  officeCode?: string;
  name?: string;
  officeType?: string;
  street?: string;
  city?: string;
  commune?: string;
  region?: string;
  country?: string;
  postalCode?: string | null;
  email?: string | null;
  phone?: string | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  notes?: string | null;
}
export interface DeactivateOtecOfficeDto {
  expectedVersion: number;
  reason?: string;
}
