import { describe, expect, it } from 'vitest';

import { OtecExpirationClassifier } from './otec-expiration-classifier.js';

const evaluatedAt = new Date('2026-07-17T18:00:00.000Z');
const classifier = new OtecExpirationClassifier();

describe('OtecExpirationClassifier', () => {
  it.each([
    ['today', new Date('2026-07-17T00:00:00.000Z'), 'EXPIRING_SOON', 0],
    ['tomorrow', new Date('2026-07-18T00:00:00.000Z'), 'EXPIRING_SOON', 1],
    ['inside', new Date('2026-07-30T00:00:00.000Z'), 'EXPIRING_SOON', 13],
    ['expired', new Date('2026-07-16T00:00:00.000Z'), 'EXPIRED', -1],
  ] as const)(
    'classifies %s using inclusive UTC calendar dates',
    (_label, validUntil, state, days) => {
      expect(classifier.classify(record({ validUntil }), evaluatedAt, 30)).toMatchObject({
        state,
        daysUntilExpiration: days,
      });
    },
  );

  it('omits a current record outside the configured window', () => {
    expect(
      classifier.classify(
        record({ validUntil: new Date('2026-09-01T00:00:00.000Z') }),
        evaluatedAt,
        30,
      ),
    ).toBeNull();
  });

  it('classifies an active record without validUntil as UNDATED', () => {
    expect(classifier.classify(record({ validUntil: null }), evaluatedAt, 30)).toMatchObject({
      state: 'UNDATED',
    });
  });

  it.each(['SUSPENDED', 'REVOKED'] as const)('classifies %s before date state', (status) => {
    expect(classifier.classify(record({ status }), evaluatedAt, 30)).toMatchObject({
      state: status,
    });
  });

  it.each(['INACTIVE', 'DRAFT', 'CANCELLED', 'CLOSED', 'SUPERSEDED'])(
    'omits non-reportable %s records',
    (status) => {
      expect(classifier.classify(record({ status }), evaluatedAt, 30)).toBeNull();
    },
  );

  it('omits a future record that is not yet effective', () => {
    expect(
      classifier.classify(
        record({ validFrom: new Date('2026-07-18T00:00:00.000Z') }),
        evaluatedAt,
        30,
      ),
    ).toBeNull();
  });
});

function record(
  overrides: Partial<{ status: string; validFrom: Date | null; validUntil: Date | null }> = {},
) {
  return {
    id: 'record-1',
    entityType: 'OTEC_ACCREDITATION',
    status: 'ACTIVE',
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validUntil: new Date('2027-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
