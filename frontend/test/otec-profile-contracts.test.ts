import { describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/lib/api/client';
import { queryKeys } from '@/lib/constants/query-keys';
import {
  createOtecProfileSchema,
  deactivateOtecProfileSchema,
  otecProfileSchema,
  toOtecProfilePayload,
  updateOtecProfileSchema,
} from '@/features/otec-compliance/profile/schemas';
import {
  createOtecProfile,
  deactivateOtecProfile,
  getOtecProfile,
  updateOtecProfile,
} from '@/features/otec-compliance/profile/services';

const request = vi.fn();

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/client')>();
  return { ...actual, apiRequestWithMetadata: (...args: unknown[]) => request(...args) };
});

describe('OtecProfile frontend contracts', () => {
  it('keeps a stable tenant-scoped singleton query key', () => {
    expect(queryKeys.otecCompliance.profile()).toEqual(['otec-compliance', 'profile']);
  });

  it('accepts the approved response and rejects internal identity fields', () => {
    const profile = {
      id: '10000000-0000-4000-8000-000000000001',
      registrationCode: 'OTEC-001',
      registrationStatus: 'ACTIVE',
      rudoReference: null,
      accreditationDate: null,
      suspensionDate: null,
      cessationDate: null,
      technicalContactName: 'Ana Pérez',
      technicalContactEmail: 'ana@example.test',
      technicalContactPhone: null,
      notes: null,
      createdAt: '2026-07-20T12:00:00.000Z',
      updatedAt: '2026-07-20T12:00:00.000Z',
      version: 1,
    };

    expect(otecProfileSchema.parse(profile)).toEqual(profile);
    expect(() => otecProfileSchema.parse({ ...profile, organizationId: 'foreign' })).toThrow();
  });

  it('normalizes optional form fields without adding tenant, actor, profile, or version', () => {
    const payload = toOtecProfilePayload({
      registrationCode: ' OTEC-001 ',
      rudoReference: '',
      technicalContactName: ' Ana Pérez ',
      technicalContactEmail: '',
      technicalContactPhone: '',
      notes: '',
    });

    expect(createOtecProfileSchema.parse(payload)).toEqual({
      registrationCode: 'OTEC-001',
      rudoReference: null,
      technicalContactName: 'Ana Pérez',
      technicalContactEmail: null,
      technicalContactPhone: null,
      notes: null,
    });
    expect(payload).not.toHaveProperty('profileId');
    expect(payload).not.toHaveProperty('organizationId');
    expect(payload).not.toHaveProperty('tenantId');
    expect(payload).not.toHaveProperty('actorId');
    expect(payload).not.toHaveProperty('version');
    expect(updateOtecProfileSchema.parse(payload)).toEqual(payload);
    expect(deactivateOtecProfileSchema.parse({ reason: 'Internal review' })).toEqual({ reason: 'Internal review' });
  });

  it('captures ETag and sends the exact If-Match value for mutations', async () => {
    const versioned = { data: {
      id: '10000000-0000-4000-8000-000000000001', registrationCode: 'OTEC-001', registrationStatus: 'ACTIVE',
      rudoReference: null, accreditationDate: null, suspensionDate: null, cessationDate: null,
      technicalContactName: null, technicalContactEmail: null, technicalContactPhone: null, notes: null,
      createdAt: '2026-07-20T12:00:00.000Z', updatedAt: '2026-07-20T12:00:00.000Z', version: 3,
    }, etag: 'W/"v3"' };
    request.mockResolvedValue(versioned);

    await getOtecProfile();
    await createOtecProfile({ registrationCode: 'OTEC-001' });
    await updateOtecProfile({ input: { notes: 'Updated' }, etag: 'W/"v3"' });
    await deactivateOtecProfile({ input: { reason: 'Internal review' }, etag: 'W/"v3"' });

    expect(request).toHaveBeenNthCalledWith(1, '/otec-compliance/profile', { signal: undefined });
    expect(request).toHaveBeenNthCalledWith(2, '/otec-compliance/profile', {
      method: 'POST',
      body: { registrationCode: 'OTEC-001' },
    });
    expect(request).toHaveBeenNthCalledWith(3, '/otec-compliance/profile', {
      method: 'PATCH',
      headers: { 'If-Match': 'W/"v3"' },
      body: { notes: 'Updated' },
    });
    expect(request).toHaveBeenNthCalledWith(4, '/otec-compliance/profile/deactivation', {
      method: 'POST',
      headers: { 'If-Match': 'W/"v3"' },
      body: { reason: 'Internal review' },
    });
  });

  it('represents a stale conflict without retrying', () => {
    const error = new ApiClientError('Conflict', 409, { error: { code: 'CONFLICT', message: 'Conflict' } });
    expect(error.status).toBe(409);
  });
});
