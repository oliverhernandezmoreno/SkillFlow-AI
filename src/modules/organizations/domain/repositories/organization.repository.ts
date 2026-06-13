import type { PaginatedResult, PaginationInput } from '../../../../shared/application/pagination.js';
import type { Organization } from '../entities/organization.entity.js';

export interface OrganizationSearchFilters {
  search?: string | undefined;
}

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findByTaxId(taxId: string): Promise<Organization | null>;
  search(
    filters: OrganizationSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Organization>>;
  save(organization: Organization): Promise<void>;
  update(organization: Organization): Promise<void>;
}
