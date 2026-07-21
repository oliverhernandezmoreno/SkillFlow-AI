import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/lib/constants/query-keys';
import {
  payload,
  readinessSchema,
  resolutionFormSchema,
} from '@/features/otec-compliance/completion/schemas';
import {
  createResolution,
  deactivateResolution,
  listResolutions,
  supersedeResolution,
  updateResolution,
} from '@/features/otec-compliance/completion/services';
const request = vi.fn();
vi.mock('@/lib/api/client', async (original) => ({
  ...(await original<typeof import('@/lib/api/client')>()),
  apiRequestWithMetadata: (...args: unknown[]) => request(...args),
}));
beforeEach(() => request.mockReset());
describe('OTEC completion contracts', () => {
  it('uses stable resolution/readiness keys', () => {
    expect(queryKeys.otecCompliance.resolutions.list({ page: 1 })).toEqual([
      'otec-compliance',
      'resolutions',
      { page: 1 },
    ]);
    expect(queryKeys.otecCompliance.readiness.dashboard('profile')).toEqual([
      'otec-compliance',
      'readiness',
      'profile',
    ]);
  });
  it('validates Resolution dates and maps no trusted identity', () => {
    expect(resolutionFormSchema.safeParse({ ...form(), issuedAt: '' }).success).toBe(false);
    const body = payload(form());
    for (const k of ['organizationId', 'tenantId', 'actorId', 'version', 'otecProfileId'])
      expect(body).not.toHaveProperty(k);
  });
  it('parses backend readiness without recalculating rules', () => {
    expect(readinessSchema.parse(readiness()).score).toBe(83);
  });
  it('rejects the internal ruleCode field when public code is absent', () => {
    const input: unknown = {
      ...readiness(),
      findings: [
        {
          ruleCode: 'OTEC-ACC-001',
          severity: 'BLOCKING',
          message: 'Missing',
          remediation: 'Add evidence',
        },
      ],
    };
    expect(readinessSchema.safeParse(input).success).toBe(false);
  });
  it('maps list and literal concurrency headers', async () => {
    request
      .mockResolvedValueOnce({
        data: { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } },
        etag: null,
      })
      .mockResolvedValueOnce({ data: resolution(), etag: 'W/"v2"' })
      .mockResolvedValueOnce({ data: resolution(), etag: 'W/"v3"' })
      .mockResolvedValueOnce({ data: resolution(), etag: 'W/"v4"' })
      .mockResolvedValueOnce({
        data: { replaced: resolution(), replacement: resolution() },
        etag: null,
      });
    await listResolutions({ page: 1, pageSize: 20, status: 'ACTIVE', type: 'AUTHORIZATION' });
    await createResolution('30000000-0000-4000-8000-000000000001', payload(form()));
    await updateResolution({ id: resolution().id, etag: 'W/"v2"', input: { notes: 'x' } });
    await deactivateResolution({ id: resolution().id, etag: 'W/"v3"' });
    await supersedeResolution({
      id: resolution().id,
      etag: 'W/"v4"',
      replacementResolutionId: '20000000-0000-4000-8000-000000000001',
      replacementIfMatch: 'W/"v2"',
    });
    expect(request.mock.calls[2]?.[1]).toMatchObject({ headers: { 'If-Match': 'W/"v2"' } });
    expect(request.mock.calls[4]?.[1]).toMatchObject({
      headers: { 'If-Match': 'W/"v4"' },
      body: { replacementIfMatch: 'W/"v2"' },
    });
  });
});
function form() {
  return {
    resolutionType: 'AUTHORIZATION' as const,
    resolutionNumber: 'RES-1',
    issuingAuthority: 'Fictitious Authority',
    issuedAt: '2026-01-01',
    validFrom: '',
    validUntil: '',
    scope: '',
    documentId: '',
    notes: '',
  };
}
function resolution() {
  return {
    id: '10000000-0000-4000-8000-000000000001',
    otecProfileId: '30000000-0000-4000-8000-000000000001',
    resolutionType: 'AUTHORIZATION',
    resolutionNumber: 'RES-1',
    issuingAuthority: 'Fictitious Authority',
    issuedAt: '2026-01-01T00:00:00.000Z',
    validFrom: null,
    validUntil: null,
    status: 'ACTIVE',
    scope: null,
    supersedesResolutionId: null,
    documentId: null,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    version: 1,
  };
}
function readiness() {
  const f = {
    code: 'OTEC-ACC-001',
    severity: 'BLOCKING',
    message: 'Missing',
    remediation: 'Add evidence',
  };
  return {
    otecProfileId: '30000000-0000-4000-8000-000000000001',
    status: 'NOT_READY',
    evaluatedAt: '2026-01-01T00:00:00.000Z',
    score: 83,
    policyVersion: 'v1',
    blockingIssues: [f],
    warnings: [],
    passedChecks: [],
    findings: [f],
    expiringItems: [],
    missingItems: [f],
    metadata: { basis: 'INTERNAL_CONFIGURED_RECORDS', officialValidation: false },
  };
}
