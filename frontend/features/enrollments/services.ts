import { apiRequest } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-params';
import type { Enrollment, ListFilters, PaginatedResponse } from '@/types/resources';

export interface EnrollmentFilters extends ListFilters {
  employeeId?: string;
  trainingSessionId?: string;
}

export function listEnrollments(filters: EnrollmentFilters = {}) {
  return apiRequest<PaginatedResponse<Enrollment>>(`/enrollments${toQueryString(filters)}`);
}
