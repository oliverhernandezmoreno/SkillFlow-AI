import { apiRequest } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-params';
import type { ListFilters, PaginatedResponse, TrainingPlan } from '@/types/resources';

export function listTrainingPlans(filters: ListFilters = {}) {
  return apiRequest<PaginatedResponse<TrainingPlan>>(`/training-plans${toQueryString(filters)}`);
}
