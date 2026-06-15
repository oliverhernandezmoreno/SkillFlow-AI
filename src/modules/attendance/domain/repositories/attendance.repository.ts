import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../shared/application/pagination.js';
import type {
  AttendanceRecord,
  AttendanceStatus,
} from '../entities/attendance-record.entity.js';

export interface AttendanceSearchFilters {
  organizationId: string;
  enrollmentId?: string | undefined;
  trainingSessionId?: string | undefined;
  employeeId?: string | undefined;
  status?: AttendanceStatus | undefined;
}

export interface AttendanceRepository {
  findById(id: string, organizationId: string): Promise<AttendanceRecord | null>;
  findByEnrollment(organizationId: string, enrollmentId: string): Promise<AttendanceRecord | null>;
  search(
    filters: AttendanceSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<AttendanceRecord>>;
  save(attendanceRecord: AttendanceRecord): Promise<void>;
  update(attendanceRecord: AttendanceRecord): Promise<void>;
}
