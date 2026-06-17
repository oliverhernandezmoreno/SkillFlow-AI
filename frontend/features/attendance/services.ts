import { apiRequest } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-params';
import type { AttendanceRecord, ListFilters, PaginatedResponse } from '@/types/resources';

export function listAttendance(filters: ListFilters = {}) {
  return apiRequest<PaginatedResponse<AttendanceRecord>>(`/attendance${toQueryString(filters)}`);
}
