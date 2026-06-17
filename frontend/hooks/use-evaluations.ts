import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createEvaluation, listEvaluations, submitEvaluation, type EvaluationFilters } from '@/features/evaluations/services';
import { queryKeys } from '@/lib/constants/query-keys';

export function useEvaluations(filters: EvaluationFilters = {}) {
  return useQuery({
    queryKey: queryKeys.evaluations.list(filters),
    queryFn: () => listEvaluations(filters),
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvaluation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.evaluations.lists() }),
  });
}

export function useSubmitEvaluation() {
  return useMutation({
    mutationFn: ({ evaluationId, input }: { evaluationId: string; input: { employeeId: string; answers: object[] } }) =>
      submitEvaluation(evaluationId, input),
  });
}
