import type { OrganizationStatus, OrganizationType } from '../../domain/entities/organization.entity.js';

export interface OrganizationDto {
  id: string;
  name: string;
  taxId: string;
  type: OrganizationType;
  status: OrganizationStatus;
  legalName: string;
  industry: string | null;
  country: string;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationDto {
  name: string;
  taxId: string;
  type: OrganizationType;
  legalName?: string | undefined;
  email?: string | undefined;
  industry?: string | undefined;
  country?: string | undefined;
  settings?: Record<string, unknown> | undefined;
}

export type UpdateOrganizationDto = Partial<CreateOrganizationDto>;
