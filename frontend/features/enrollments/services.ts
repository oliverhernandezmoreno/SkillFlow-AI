import { apiRequest } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-params';
import type { Enrollment, EnrollmentInput, ListFilters, PaginatedResponse } from '@/types/resources';

export interface EnrollmentFilters extends ListFilters {
  employeeId?: string;
  trainingSessionId?: string;
}

export function listEnrollments(filters: EnrollmentFilters = {}) {
  return apiRequest<PaginatedResponse<Enrollment>>(`/enrollments${toQueryString(filters)}`);
}

export function createEnrollment(input: EnrollmentInput) {
  return apiRequest<Enrollment>('/enrollments', {
    method: 'POST',
    body: input,
  });
}

export function cancelEnrollment(enrollmentId: string) {
  return apiRequest<Enrollment>(`/enrollments/${enrollmentId}/cancel`, {
    method: 'POST',
  });
}
