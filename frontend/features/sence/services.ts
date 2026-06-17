import { apiRequest } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-params';
import type { ListFilters, PaginatedResponse, SenceDeclaration, SenceDeclarationInput } from '@/types/resources';

export function listSenceDeclarations(filters: ListFilters = {}) {
  return apiRequest<PaginatedResponse<SenceDeclaration>>(`/sence/declarations${toQueryString(filters)}`);
}

export function createSenceDeclaration(input: SenceDeclarationInput) {
  return apiRequest<SenceDeclaration>('/sence/declarations', {
    method: 'POST',
    body: input,
  });
}

export function validateSenceDeclaration(declarationId: string) {
  return apiRequest<{ valid: boolean; warnings: string[]; errors: string[] }>(
    `/sence/declarations/${declarationId}/validate`,
    { method: 'POST' },
  );
}

export function buildSenceEvidence(declarationId: string) {
  return apiRequest<{ declarationId: string; trainingSessionId: string; evidence: unknown[] }>(
    `/sence/declarations/${declarationId}/evidence`,
    { method: 'POST' },
  );
}

export function markSenceReady(declarationId: string) {
  return apiRequest<SenceDeclaration>(`/sence/declarations/${declarationId}/ready`, {
    method: 'POST',
  });
}

export function submitSenceDeclaration(declarationId: string) {
  return apiRequest<SenceDeclaration>(`/sence/declarations/${declarationId}/submit`, {
    method: 'POST',
    body: {},
  });
}
