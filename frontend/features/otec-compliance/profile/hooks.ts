import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/query-keys';
import { createOtecProfile, deactivateOtecProfile, getOtecProfile, updateOtecProfile } from './services';

export function useOtecProfile() {
  return useQuery({
    queryKey: queryKeys.otecCompliance.profile(),
    queryFn: ({ signal }) => getOtecProfile(signal),
    retry: (count, error) => !isNonRetryable(error) && count < 2,
  });
}

function useProfileMutation<TInput>(mutationFn: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.otecCompliance.profile() }),
  });
}

export function useCreateOtecProfile() { return useProfileMutation(createOtecProfile); }
export function useUpdateOtecProfile() { return useProfileMutation(updateOtecProfile); }
export function useDeactivateOtecProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateOtecProfile,
    retry: false,
    onSuccess: async () => {
      queryClient.setQueryData(queryKeys.otecCompliance.profile(), null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.otecCompliance.profile() });
    },
  });
}

function isNonRetryable(error: unknown): boolean {
  const status = (error as { status?: number }).status;
  return status !== undefined && [400, 401, 403, 404, 409, 412, 422].includes(status);
}
