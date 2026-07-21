import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/constants/query-keys';
import {
  accreditationFormSchema,
  certificationFormSchema,
  toAccreditationPayload,
  toCertificationPayload,
} from '@/features/otec-compliance/regulatory/schemas';
import {
  createAccreditation,
  deactivateCertification,
  listAccreditations,
  revokeAccreditation,
  updateCertification,
} from '@/features/otec-compliance/regulatory/services';

const request = vi.fn();
vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/client')>();
  return { ...actual, apiRequestWithMetadata: (...args: unknown[]) => request(...args) };
});

describe('OTEC regulatory frontend contracts', () => {
  beforeEach(() => request.mockReset());
  it('uses stable list and detail query keys', () => {
    const filters = { page: 2, pageSize: 10, status: 'ACTIVE' as const };
    expect(queryKeys.otecCompliance.accreditations.list(filters)).toEqual(['otec-compliance', 'accreditations', filters]);
    expect(queryKeys.otecCompliance.accreditations.detail('record')).toEqual(['otec-compliance', 'accreditations', 'record']);
    expect(queryKeys.otecCompliance.certifications.list(filters)).toEqual(['otec-compliance', 'quality-certifications', filters]);
  });

  it('validates distinct forms and date ordering', () => {
    expect(accreditationFormSchema.safeParse({ accreditationType: '', accreditationNumber: '', issuedAt: '', validFrom: '2027-01-01', validUntil: '2026-01-01', issuingAuthority: '', source: '', externalReference: '', notes: '' }).success).toBe(false);
    expect(certificationFormSchema.safeParse({ certificationType: 'NCH_2728', certificationNumber: 'CERT-1', certifyingEntity: 'Entity', scope: '', issuedAt: '', validFrom: '2026-01-01', validUntil: '2027-01-01', documentId: '', notes: '' }).success).toBe(true);
  });

  it('maps approved payloads without tenant, actor, or version fields', () => {
    const accreditation = toAccreditationPayload({ accreditationType: 'INTERNAL', accreditationNumber: 'ACC-1', issuedAt: '', validFrom: '', validUntil: '', issuingAuthority: '', source: '', externalReference: '', notes: '' });
    const certification = toCertificationPayload({ certificationType: 'OTHER', certificationNumber: 'CERT-1', certifyingEntity: 'Entity', scope: '', issuedAt: '', validFrom: '', validUntil: '', documentId: '', notes: '' });
    for (const payload of [accreditation, certification]) {
      expect(payload).not.toHaveProperty('organizationId');
      expect(payload).not.toHaveProperty('tenantId');
      expect(payload).not.toHaveProperty('actorId');
      expect(payload).not.toHaveProperty('version');
    }
  });

  it('maps filters and exact transition/update concurrency headers', async () => {
    request
      .mockResolvedValueOnce({ data: { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }, etag: null })
      .mockResolvedValueOnce({ data: sampleAccreditation(), etag: 'W/"v3"' })
      .mockResolvedValueOnce({ data: sampleCertification(), etag: 'W/"v4"' })
      .mockResolvedValueOnce({ data: { ...sampleCertification(), status: 'INACTIVE', version: 5 }, etag: 'W/"v5"' });
    await listAccreditations({ page: 1, pageSize: 20, status: 'ACTIVE', validAt: '2026-07-20' });
    await revokeAccreditation({ id: '10000000-0000-4000-8000-000000000001', etag: 'W/"v2"', reason: 'Review' });
    await updateCertification({ id: '20000000-0000-4000-8000-000000000001', etag: 'W/"v3"', input: { scope: 'Updated' } });
    await deactivateCertification({ id: '20000000-0000-4000-8000-000000000001', etag: 'W/"v4"', reason: 'Expired' });
    expect(request.mock.calls[0]?.[0]).toBe('/otec-compliance/accreditations?page=1&pageSize=20&status=ACTIVE&validAt=2026-07-20');
    expect(request.mock.calls[1]?.[1]).toMatchObject({ method: 'POST', headers: { 'If-Match': 'W/"v2"' }, body: { reason: 'Review' } });
    expect(request.mock.calls[2]?.[1]).toMatchObject({ method: 'PATCH', headers: { 'If-Match': 'W/"v3"' } });
    expect(request.mock.calls[3]?.[1]).toMatchObject({ method: 'POST', headers: { 'If-Match': 'W/"v4"' } });
  });

  it('adds only the contract-required profile identifier on create', async () => {
    request.mockResolvedValue({ data: sampleAccreditation(), etag: 'W/"v1"' });
    await createAccreditation('30000000-0000-4000-8000-000000000001', { accreditationType: 'INTERNAL', accreditationNumber: 'ACC-1' });
    expect(request.mock.calls[0]?.[1]?.body).toMatchObject({ otecProfileId: '30000000-0000-4000-8000-000000000001' });
    expect(request.mock.calls[0]?.[1]?.body).not.toHaveProperty('organizationId');
  });
});

function sampleAccreditation() {
  return { id: '10000000-0000-4000-8000-000000000001', otecProfileId: '30000000-0000-4000-8000-000000000001', accreditationType: 'INTERNAL', accreditationNumber: 'ACC-1', status: 'DRAFT', issuedAt: null, validFrom: null, validUntil: null, suspendedAt: null, revokedAt: null, issuingAuthority: null, source: null, externalReference: null, notes: null, createdAt: '2026-07-20T00:00:00.000Z', updatedAt: '2026-07-20T00:00:00.000Z', version: 1 };
}

function sampleCertification() {
  return { id: '20000000-0000-4000-8000-000000000001', otecProfileId: '30000000-0000-4000-8000-000000000001', certificationType: 'NCH_2728', certificationNumber: 'CERT-1', certifyingEntity: 'Entity', scope: null, issuedAt: null, validFrom: null, validUntil: null, status: 'ACTIVE', documentId: null, notes: null, createdAt: '2026-07-20T00:00:00.000Z', updatedAt: '2026-07-20T00:00:00.000Z', version: 3 };
}
