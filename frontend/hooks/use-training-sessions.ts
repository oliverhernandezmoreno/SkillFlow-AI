import { useQuery } from '@tanstack/react-query';

import { listTrainingSessions, type TrainingSessionFilters } from '@/features/sessions/services';
import { queryKeys } from '@/lib/constants/query-keys';

export function useTrainingSessions(filters: TrainingSessionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.trainingSessions.list(filters),
    queryFn: () => listTrainingSessions(filters),
  });
}
