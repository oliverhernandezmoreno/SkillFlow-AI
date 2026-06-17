import { apiRequest } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-params';
import type { ListFilters, PaginatedResponse, TrainingSession } from '@/types/resources';

export interface TrainingSessionFilters extends ListFilters {
  courseId?: string;
  from?: string;
  to?: string;
}

export function listTrainingSessions(filters: TrainingSessionFilters = {}) {
  return apiRequest<PaginatedResponse<TrainingSession>>(`/training-sessions${toQueryString(filters)}`);
}
