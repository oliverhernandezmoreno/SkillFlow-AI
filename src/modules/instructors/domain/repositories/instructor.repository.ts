import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../shared/application/pagination.js';
import type { Instructor, InstructorStatus } from '../entities/instructor.entity.js';

export interface InstructorSearchFilters {
  organizationId: string;
  status?: InstructorStatus | undefined;
  providerId?: string | undefined;
  search?: string | undefined;
}

export interface InstructorRepository {
  findById(id: string, organizationId: string): Promise<Instructor | null>;
  findByEmail(organizationId: string, normalizedEmail: string): Promise<Instructor | null>;
  search(
    filters: InstructorSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Instructor>>;
  save(instructor: Instructor): Promise<void>;
  update(instructor: Instructor): Promise<void>;
}
