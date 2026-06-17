import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { issueCertificate, listCertificates, verifyCertificate } from '@/features/certificates/services';
import { queryKeys } from '@/lib/constants/query-keys';
import type { ListFilters } from '@/types/resources';

export function useCertificates(filters: ListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.certificates.list(filters),
    queryFn: () => listCertificates(filters),
  });
}

export function useIssueCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueCertificate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.certificates.lists() }),
  });
}

export function useVerifyCertificate() {
  return useMutation({
    mutationFn: verifyCertificate,
  });
}
