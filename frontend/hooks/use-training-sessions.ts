import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createTrainingSession,
  listTrainingSessions,
  publishTrainingSession,
  type TrainingSessionFilters,
  updateTrainingSession,
} from '@/features/sessions/services';
import { queryKeys } from '@/lib/constants/query-keys';
import type { TrainingSessionInput } from '@/types/resources';

export function useTrainingSessions(filters: TrainingSessionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.trainingSessions.list(filters),
    queryFn: () => listTrainingSessions(filters),
  });
}

export function useCreateTrainingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTrainingSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.trainingSessions.lists() }),
  });
}

export function useUpdateTrainingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trainingSessionId, input }: { trainingSessionId: string; input: Partial<TrainingSessionInput> }) =>
      updateTrainingSession(trainingSessionId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.trainingSessions.lists() }),
  });
}

export function usePublishTrainingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishTrainingSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.trainingSessions.lists() }),
  });
}
