import { apiRequest } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-params';
import type { ListFilters, PaginatedResponse, TrainingSession, TrainingSessionInput } from '@/types/resources';

export interface TrainingSessionFilters extends ListFilters {
  courseId?: string;
  from?: string;
  to?: string;
}

export function listTrainingSessions(filters: TrainingSessionFilters = {}) {
  return apiRequest<PaginatedResponse<TrainingSession>>(`/training-sessions${toQueryString(filters)}`);
}

export function createTrainingSession(input: TrainingSessionInput) {
  return apiRequest<TrainingSession>('/training-sessions', {
    method: 'POST',
    body: input,
  });
}

export function updateTrainingSession(trainingSessionId: string, input: Partial<TrainingSessionInput>) {
  return apiRequest<TrainingSession>(`/training-sessions/${trainingSessionId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function publishTrainingSession(trainingSessionId: string) {
  return apiRequest<TrainingSession>(`/training-sessions/${trainingSessionId}/publish`, {
    method: 'POST',
  });
}
