import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cancelEnrollment, createEnrollment, listEnrollments, type EnrollmentFilters } from '@/features/enrollments/services';
import { queryKeys } from '@/lib/constants/query-keys';

export function useEnrollments(filters: EnrollmentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.enrollments.list(filters),
    queryFn: () => listEnrollments(filters),
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEnrollment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.lists() }),
  });
}

export function useCancelEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelEnrollment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.lists() }),
  });
}
