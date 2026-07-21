export interface OrganizationComplianceProjection {
  id: string;
  legalName: string;
  tradeName: string | null;
  taxId: string;
  type: 'CLIENT' | 'CLIENT_COMPANY' | 'OTEC' | 'PROVIDER' | 'HOLDING' | 'INTERNAL';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface OrganizationComplianceReadPort {
  findById(organizationId: string): Promise<OrganizationComplianceProjection | null>;
}

export interface TenantDocumentOwnershipPort {
  belongsToTenant(organizationId: string, documentId: string): Promise<boolean>;
}
