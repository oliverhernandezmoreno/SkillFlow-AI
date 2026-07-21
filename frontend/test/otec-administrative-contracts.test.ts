import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/lib/constants/query-keys';
import { officeFormSchema, representativeFormSchema, toOfficePayload, toRepresentativePayload } from '@/features/otec-compliance/administrative/schemas';
import { createOffice, deactivateRepresentative, listOffices, updateRepresentative } from '@/features/otec-compliance/administrative/services';

const request = vi.fn();
vi.mock('@/lib/api/client', async (original) => ({ ...(await original<typeof import('@/lib/api/client')>()), apiRequestWithMetadata: (...args: unknown[]) => request(...args) }));

describe('OTEC administrative frontend contracts', () => {
  beforeEach(() => request.mockReset());
  it('uses stable tenant-safe list and detail keys', () => {
    const filters = { page: 1, pageSize: 20, status: 'ACTIVE' as const };
    expect(queryKeys.otecCompliance.offices.list(filters)).toEqual(['otec-compliance', 'offices', filters]);
    expect(queryKeys.otecCompliance.offices.detail('office')).toEqual(['otec-compliance', 'offices', 'office']);
    expect(queryKeys.otecCompliance.representatives.list(filters)).toEqual(['otec-compliance', 'legal-representatives', filters]);
  });
  it('validates exact Office and Representative fields', () => {
    expect(officeFormSchema.safeParse({ officeCode: 'HQ', name: 'Office', officeType: 'HEADQUARTERS', street: 'Test 1', city: 'Santiago', commune: 'Santiago', region: 'Metropolitana', country: 'CL', postalCode: '', email: 'bad', phone: '', validFrom: '', validUntil: '', notes: '' }).success).toBe(false);
    expect(representativeFormSchema.safeParse({ firstName: 'Fictitious', lastName: 'Representative', taxId: '12.345.678-5', email: 'rep@example.test', phone: '', roleTitle: 'Legal Representative', validFrom: '2027-01-01', validUntil: '2026-01-01', appointmentDocumentId: '', notes: '' }).success).toBe(false);
  });
  it('maps minimal payloads without trusted identity or persistence metadata', () => {
    const office = toOfficePayload({ officeCode: 'HQ', name: 'Office', officeType: 'HEADQUARTERS', street: 'Test 1', city: 'Santiago', commune: 'Santiago', region: 'Metropolitana', country: 'CL', postalCode: '', email: '', phone: '', validFrom: '', validUntil: '', notes: '' });
    const representative = toRepresentativePayload({ firstName: 'Fictitious', lastName: 'Representative', taxId: '12.345.678-5', email: '', phone: '', roleTitle: 'Legal Representative', validFrom: '', validUntil: '', appointmentDocumentId: '', notes: '' });
    for (const payload of [office, representative]) for (const key of ['organizationId', 'tenantId', 'actorId', 'version', 'deletedAt']) expect(payload).not.toHaveProperty(key);
  });
  it('uses approved filters and literal If-Match for update/deactivation', async () => {
    request.mockResolvedValueOnce({ data: { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }, etag: null }).mockResolvedValueOnce({ data: representative(), etag: 'W/"v4"' }).mockResolvedValueOnce({ data: { ...representative(), active: false }, etag: 'W/"v5"' });
    await listOffices({ page: 1, pageSize: 20, status: 'ACTIVE', type: 'HEADQUARTERS', validAt: '2026-07-20' });
    await updateRepresentative({ id: representative().id, etag: 'W/"v3"', input: { roleTitle: 'Updated' } });
    await deactivateRepresentative({ id: representative().id, etag: 'W/"v4"' });
    expect(request.mock.calls[0]?.[0]).toBe('/otec-compliance/offices?page=1&pageSize=20&status=ACTIVE&type=HEADQUARTERS&validAt=2026-07-20');
    expect(request.mock.calls[1]?.[1]).toMatchObject({ method: 'PATCH', headers: { 'If-Match': 'W/"v3"' } });
    expect(request.mock.calls[2]?.[1]).toMatchObject({ method: 'POST', headers: { 'If-Match': 'W/"v4"' }, body: {} });
  });
  it('adds only authenticated profile context to create', async () => {
    request.mockResolvedValue({ data: office(), etag: 'W/"v1"' });
    await createOffice('30000000-0000-4000-8000-000000000001', { officeCode: 'HQ', name: 'Office', officeType: 'HEADQUARTERS', street: 'Test 1', city: 'Santiago', commune: 'Santiago', region: 'Metropolitana', country: 'CL' });
    expect(request.mock.calls[0]?.[1]?.body).toMatchObject({ otecProfileId: '30000000-0000-4000-8000-000000000001' });
  });
});
function office() { return { id: '10000000-0000-4000-8000-000000000001', otecProfileId: '30000000-0000-4000-8000-000000000001', officeCode: 'HQ', name: 'Office', officeType: 'HEADQUARTERS', status: 'ACTIVE', street: 'Test 1', city: 'Santiago', commune: 'Santiago', region: 'Metropolitana', country: 'CL', postalCode: null, email: null, phone: null, validFrom: null, validUntil: null, notes: null, createdAt: '2026-07-20T00:00:00.000Z', updatedAt: '2026-07-20T00:00:00.000Z', version: 1 }; }
function representative() { return { id: '20000000-0000-4000-8000-000000000001', otecProfileId: '30000000-0000-4000-8000-000000000001', firstName: 'Fictitious', lastName: 'Representative', taxId: '12.345.678-5', email: null, phone: null, roleTitle: 'Legal Representative', validFrom: null, validUntil: null, active: true, appointmentDocumentId: null, notes: null, createdAt: '2026-07-20T00:00:00.000Z', updatedAt: '2026-07-20T00:00:00.000Z', version: 3 }; }
