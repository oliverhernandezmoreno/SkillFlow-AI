import { apiRequest } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-params';
import type { AttendanceInput, AttendanceRecord, ListFilters, PaginatedResponse } from '@/types/resources';

export function listAttendance(filters: ListFilters = {}) {
  return apiRequest<PaginatedResponse<AttendanceRecord>>(`/attendance${toQueryString(filters)}`);
}

export function createAttendance(input: AttendanceInput) {
  return apiRequest<AttendanceRecord>('/attendance', {
    method: 'POST',
    body: input,
  });
}

export function createBulkAttendance(input: {
  organizationId: string;
  trainingSessionId: string;
  records: Array<Pick<AttendanceInput, 'enrollmentId' | 'employeeId' | 'status' | 'method'>>;
}) {
  return apiRequest<AttendanceRecord[]>('/attendance/bulk', {
    method: 'POST',
    body: input,
  });
}
