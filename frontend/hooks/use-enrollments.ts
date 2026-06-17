import { useQuery } from '@tanstack/react-query';

import { listEnrollments, type EnrollmentFilters } from '@/features/enrollments/services';
import { queryKeys } from '@/lib/constants/query-keys';

export function useEnrollments(filters: EnrollmentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.enrollments.list(filters),
    queryFn: () => listEnrollments(filters),
  });
}
