import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createAttendance, createBulkAttendance, listAttendance } from '@/features/attendance/services';
import { queryKeys } from '@/lib/constants/query-keys';
import type { ListFilters } from '@/types/resources';

export function useAttendance(filters: ListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.attendance.list(filters),
    queryFn: () => listAttendance(filters),
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAttendance,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance.lists() }),
  });
}

export function useCreateBulkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBulkAttendance,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance.lists() }),
  });
}
