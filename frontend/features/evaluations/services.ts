import { apiRequest } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-params';
import type { Evaluation, EvaluationInput, ListFilters, PaginatedResponse } from '@/types/resources';

export interface EvaluationFilters extends ListFilters {
  type?: string;
}

export function listEvaluations(filters: EvaluationFilters = {}) {
  return apiRequest<PaginatedResponse<Evaluation>>(`/evaluations${toQueryString(filters)}`);
}

export function createEvaluation(input: EvaluationInput) {
  return apiRequest<Evaluation>('/evaluations', {
    method: 'POST',
    body: input,
  });
}

export function submitEvaluation(evaluationId: string, input: { employeeId: string; answers: object[] }) {
  return apiRequest<unknown>(`/evaluations/${evaluationId}/submit`, {
    method: 'POST',
    body: input,
  });
}
