import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  buildSenceEvidence,
  createSenceDeclaration,
  listSenceDeclarations,
  markSenceReady,
  submitSenceDeclaration,
  validateSenceDeclaration,
} from '@/features/sence/services';
import { queryKeys } from '@/lib/constants/query-keys';
import type { ListFilters } from '@/types/resources';

export function useSenceDeclarations(filters: ListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.sence.declarations(filters),
    queryFn: () => listSenceDeclarations(filters),
  });
}

export function useCreateSenceDeclaration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSenceDeclaration,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sence.lists() }),
  });
}

export function useSenceActions() {
  const queryClient = useQueryClient();

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.sence.lists() });
  }

  return {
    validate: useMutation({ mutationFn: validateSenceDeclaration }),
    evidence: useMutation({ mutationFn: buildSenceEvidence }),
    ready: useMutation({ mutationFn: markSenceReady, onSuccess: invalidate }),
    submit: useMutation({ mutationFn: submitSenceDeclaration, onSuccess: invalidate }),
  };
}
