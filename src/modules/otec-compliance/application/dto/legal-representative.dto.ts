export interface LegalRepresentativeDto {
  id: string;
  organizationId: string;
  otecProfileId: string;
  firstName: string;
  lastName: string;
  taxId: string;
  email: string | null;
  phone: string | null;
  roleTitle: string;
  validFrom: Date | null;
  validUntil: Date | null;
  active: boolean;
  appointmentDocumentId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}
export interface CreateLegalRepresentativeDto {
  organizationId?: string;
  otecProfileId: string;
  firstName: string;
  lastName: string;
  taxId: string;
  email?: string | null;
  phone?: string | null;
  roleTitle: string;
  validFrom?: Date | null;
  validUntil?: Date | null;
  appointmentDocumentId?: string | null;
  notes?: string | null;
}
export interface UpdateLegalRepresentativeDto {
  expectedVersion: number;
  organizationId?: string;
  otecProfileId?: string;
  firstName?: string;
  lastName?: string;
  taxId?: string;
  email?: string | null;
  phone?: string | null;
  roleTitle?: string;
  validFrom?: Date | null;
  validUntil?: Date | null;
  appointmentDocumentId?: string | null;
  notes?: string | null;
}
export interface DeactivateLegalRepresentativeDto {
  expectedVersion: number;
  reason?: string;
}
