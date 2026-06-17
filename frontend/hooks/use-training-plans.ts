import { useQuery } from '@tanstack/react-query';

import { listTrainingPlans } from '@/features/training-plans/services';
import { queryKeys } from '@/lib/constants/query-keys';
import type { ListFilters } from '@/types/resources';

export function useTrainingPlans(filters: ListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.trainingPlans.list(filters),
    queryFn: () => listTrainingPlans(filters),
  });
}
