import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../shared/application/pagination.js';
import type { OtecProfile, OtecProfileStatus } from '../entities/otec-profile.entity.js';

export interface OtecProfileSearchFilters {
  status?: OtecProfileStatus | undefined;
}

export interface OtecProfileRepository {
  findCurrentByOrganizationId(organizationId: string): Promise<OtecProfile | null>;
  findById(organizationId: string, id: string): Promise<OtecProfile | null>;
  search(
    organizationId: string,
    filters: OtecProfileSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<OtecProfile>>;
  save(profile: OtecProfile): Promise<void>;
  update(profile: OtecProfile, expectedVersion: number): Promise<void>;
}
