import { apiRequest } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-params';
import type { Certificate, ListFilters, PaginatedResponse } from '@/types/resources';

export function listCertificates(filters: ListFilters = {}) {
  return apiRequest<PaginatedResponse<Certificate>>(`/certificates${toQueryString(filters)}`);
}
