import { apiRequest } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-params';
import type { ListFilters, PaginatedResponse, SenceDeclaration } from '@/types/resources';

export function listSenceDeclarations(filters: ListFilters = {}) {
  return apiRequest<PaginatedResponse<SenceDeclaration>>(`/sence/declarations${toQueryString(filters)}`);
}
