import type { PaginatedResult, PaginationInput } from '../../../../shared/application/pagination.js';
import type { User } from '../entities/user.entity.js';

export interface UserSearchFilters {
  organizationId: string;
  search?: string | undefined;
}

export interface UserRepository {
  findById(id: string, organizationId: string): Promise<User | null>;
  findByEmail(organizationId: string, email: string): Promise<User | null>;
  search(filters: UserSearchFilters, pagination: PaginationInput): Promise<PaginatedResult<User>>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
}
