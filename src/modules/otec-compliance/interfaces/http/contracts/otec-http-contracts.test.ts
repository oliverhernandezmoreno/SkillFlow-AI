import { describe, expect, it } from 'vitest';

import {
  ConflictError,
  ForbiddenError,
  ModuleUnavailableError,
  NotFoundError,
} from '../../../../../shared/domain/errors.js';
import {
  createOfficeBodySchema,
  listComplianceQuerySchema,
  transitionBodySchema,
  updateOfficeBodySchema,
} from './otec-http-schemas.js';
import { formatVersionEtag, parseIfMatch } from './otec-http-concurrency.js';
import { mapOtecHttpError } from './otec-http-error-mapper.js';
import { presentOtecReadiness, presentOtecResource } from './otec-http-presenter.js';

describe('OTEC HTTP design contracts', () => {
  it('rejects mass-assigned identity and protected relationships', () => {
    expect(() =>
      createOfficeBodySchema.parse(validOffice({ organizationId: crypto.randomUUID() })),
    ).toThrow();
    expect(() =>
      createOfficeBodySchema.parse(validOffice({ actorId: crypto.randomUUID() })),
    ).toThrow();
    expect(() => updateOfficeBodySchema.parse({ otecProfileId: crypto.randomUUID() })).toThrow();
  });

  it('parses ISO dates and rejects invalid ranges and enums', () => {
    const result = createOfficeBodySchema.parse(
      validOffice({
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
      }),
    );
    expect(result.validFrom).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(() => createOfficeBodySchema.parse(validOffice({ officeType: 'UNKNOWN' }))).toThrow();
    expect(() =>
      createOfficeBodySchema.parse(
        validOffice({
          validFrom: '2027-01-01',
          validUntil: '2026-01-01',
        }),
      ),
    ).toThrow();
  });

  it('validates filters and applies existing pagination defaults and maximum', () => {
    expect(listComplianceQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20 });
    expect(
      listComplianceQuerySchema.parse({ page: '2', pageSize: '100', status: 'ACTIVE' }),
    ).toMatchObject({ page: 2, pageSize: 100, status: 'ACTIVE' });
    expect(() => listComplianceQuerySchema.parse({ pageSize: '101' })).toThrow();
    expect(() => listComplianceQuerySchema.parse({ status: 'INVALID' })).toThrow();
  });

  it('uses only If-Match and ETag for expected versions', () => {
    expect(parseIfMatch('W/"v7"')).toBe(7);
    expect(formatVersionEtag(8)).toBe('W/"v8"');
    expect(() => parseIfMatch(undefined)).toThrow();
    expect(() => parseIfMatch('7')).toThrow();
    expect(() => transitionBodySchema.parse({ expectedVersion: 1 })).toThrow();
  });

  it('maps application errors without leaking internal details', () => {
    expect(mapOtecHttpError(new NotFoundError('The resource was not found'))).toEqual({
      status: 404,
      body: { error: { code: 'NOT_FOUND', message: 'Resource not found' } },
    });
    expect(mapOtecHttpError(new ForbiddenError('Permission denied')).status).toBe(403);
    expect(mapOtecHttpError(new ModuleUnavailableError('disabled')).body.error.code).toBe(
      'MODULE_UNAVAILABLE',
    );
    expect(mapOtecHttpError(new ConflictError('stale')).status).toBe(409);
    expect(mapOtecHttpError(new Error('Prisma secret')).body.error.message).toBe(
      'Internal Server Error',
    );
  });

  it('serializes dates and removes tenant, soft-delete, and infrastructure fields', () => {
    expect(
      presentOtecResource({
        id: 'id',
        organizationId: 'tenant',
        version: 2,
        validUntil: new Date('2026-12-31T00:00:00.000Z'),
        deletedAt: null,
        internalMetadata: 'secret',
      }),
    ).toEqual({ id: 'id', version: 2, validUntil: '2026-12-31T00:00:00.000Z' });
  });

  it('maps internal readiness ruleCode to the exclusive public code field', () => {
    const presented = presentOtecReadiness({
      status: 'NOT_READY',
      findings: [{ ruleCode: 'OTEC-ACC-001', severity: 'BLOCKING', message: 'Missing' }],
    });
    const finding = (presented['findings'] as Record<string, unknown>[])[0];

    expect(finding).toMatchObject({ code: 'OTEC-ACC-001' });
    expect(finding).not.toHaveProperty('ruleCode');
  });
});

function validOffice(overrides: Record<string, unknown> = {}) {
  return {
    otecProfileId: crypto.randomUUID(),
    officeCode: 'HQ-1',
    name: 'Headquarters',
    officeType: 'HEADQUARTERS',
    street: 'Test 1',
    city: 'Santiago',
    commune: 'Santiago',
    region: 'Metropolitana',
    country: 'CL',
    ...overrides,
  };
}
