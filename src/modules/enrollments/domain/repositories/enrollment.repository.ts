import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../shared/application/pagination.js';
import type { Enrollment, EnrollmentStatus } from '../entities/enrollment.entity.js';

export interface EnrollmentSearchFilters {
  organizationId: string;
  trainingSessionId?: string | undefined;
  employeeId?: string | undefined;
  status?: EnrollmentStatus | undefined;
}

export interface CreateEnrollmentCapacityInput {
  organizationId: string;
  trainingSessionId: string;
  employeeId: string;
  capacity: number;
  occupiedStatuses: EnrollmentStatus[];
}

export interface EnrollmentRepository {
  findById(id: string, organizationId: string): Promise<Enrollment | null>;
  findBySessionAndEmployee(
    organizationId: string,
    trainingSessionId: string,
    employeeId: string,
  ): Promise<Enrollment | null>;
  search(
    filters: EnrollmentSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Enrollment>>;
  createWithCapacity(input: CreateEnrollmentCapacityInput): Promise<Enrollment>;
  countOccupiedSeats(
    organizationId: string,
    trainingSessionId: string,
    occupiedStatuses: EnrollmentStatus[],
  ): Promise<number>;
  findOldestWaitlisted(
    organizationId: string,
    trainingSessionId: string,
  ): Promise<Enrollment | null>;
  save(enrollment: Enrollment): Promise<void>;
  update(enrollment: Enrollment): Promise<void>;
}
