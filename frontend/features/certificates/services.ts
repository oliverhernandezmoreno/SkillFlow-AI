import { apiRequest } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-params';
import type { Certificate, IssueCertificateInput, ListFilters, PaginatedResponse } from '@/types/resources';

export function listCertificates(filters: ListFilters = {}) {
  return apiRequest<PaginatedResponse<Certificate>>(`/certificates${toQueryString(filters)}`);
}

export function issueCertificate(input: IssueCertificateInput) {
  return apiRequest<Certificate>('/certificates', {
    method: 'POST',
    body: input,
  });
}

export function verifyCertificate(verificationCode: string) {
  return apiRequest<{ valid: boolean; status: string | null; certificateNumber: string | null }>(
    `/certificates/verify/${encodeURIComponent(verificationCode)}`,
    { skipAuth: true },
  );
}
