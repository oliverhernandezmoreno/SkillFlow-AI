import { describe, expect, it } from 'vitest';

import { OtecReadinessEvaluator, type OtecReadinessSnapshot } from './otec-readiness-evaluator.js';

const evaluatedAt = new Date('2026-07-16T12:00:00.000Z');

describe('OtecReadinessEvaluator', () => {
  const evaluator = new OtecReadinessEvaluator();

  it('returns READY when every configured blocking requirement passes', () => {
    const result = evaluator.evaluate(createReadySnapshot(), evaluatedAt);

    expect(result.status).toBe('READY');
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.passedChecks.map((check) => check.ruleCode)).toEqual(
      expect.arrayContaining([
        'OTEC-FOUND-001',
        'OTEC-ACC-001',
        'OTEC-QUAL-001',
        'OTEC-OFF-001',
        'OTEC-REP-001',
      ]),
    );
  });

  it('returns READY_WITH_WARNINGS for an upcoming expiration', () => {
    const snapshot = createReadySnapshot();
    first(snapshot.accreditations).validUntil = new Date('2026-07-25T12:00:00.000Z');

    const result = evaluator.evaluate(snapshot, evaluatedAt);

    expect(result.status).toBe('READY_WITH_WARNINGS');
    expect(result.expiringItems[0]).toMatchObject({
      ruleCode: 'OTEC-ACC-001',
      daysUntilExpiration: 9,
    });
  });

  it('returns NOT_READY without an accreditation', () => {
    const snapshot = createReadySnapshot();
    snapshot.accreditations = [];

    const result = evaluator.evaluate(snapshot, evaluatedAt);

    expect(result.status).toBe('NOT_READY');
    expect(result.blockingIssues).toContainEqual(
      expect.objectContaining({ ruleCode: 'OTEC-ACC-001' }),
    );
    expect(result.missingItems).toContainEqual(
      expect.objectContaining({ ruleCode: 'OTEC-ACC-001' }),
    );
  });

  it('returns NOT_READY when required NCh2728 is expired', () => {
    const snapshot = createReadySnapshot();
    first(snapshot.certifications).validUntil = new Date('2026-07-15T12:00:00.000Z');

    expect(evaluator.evaluate(snapshot, evaluatedAt)).toMatchObject({
      status: 'NOT_READY',
      blockingIssues: [expect.objectContaining({ ruleCode: 'OTEC-QUAL-001' })],
    });
  });

  it('does not require NCh2728 when effective configuration disables the rule', () => {
    const snapshot = createReadySnapshot();
    snapshot.settings.requireNch2728 = false;
    snapshot.certifications = [];

    const result = evaluator.evaluate(snapshot, evaluatedAt);

    expect(result.status).toBe('READY');
    expect(result.blockingIssues).toHaveLength(0);
  });

  it.each([
    ['offices', 'OTEC-OFF-001'],
    ['representatives', 'OTEC-REP-001'],
  ] as const)('returns NOT_READY when %s are missing', (field, ruleCode) => {
    const snapshot = createReadySnapshot();
    snapshot[field] = [];

    const result = evaluator.evaluate(snapshot, evaluatedAt);

    expect(result.status).toBe('NOT_READY');
    expect(result.blockingIssues).toContainEqual(expect.objectContaining({ ruleCode }));
  });

  it('evaluates only configured required resolution types', () => {
    const snapshot = createReadySnapshot();
    snapshot.settings.requiredResolutionTypes = ['AUTHORIZATION'];

    const result = evaluator.evaluate(snapshot, evaluatedAt);

    expect(result.status).toBe('NOT_READY');
    expect(result.blockingIssues).toContainEqual(
      expect.objectContaining({ ruleCode: 'OTEC-RES-001' }),
    );
  });

  it('evaluates records at a historical date', () => {
    const snapshot = createReadySnapshot();
    const historicalDate = new Date('2025-07-16T12:00:00.000Z');

    expect(evaluator.evaluate(snapshot, historicalDate).status).toBe('NOT_READY');
  });

  it('never lets a high score override a blocking issue', () => {
    const snapshot = createReadySnapshot();
    snapshot.representatives = [];

    const result = evaluator.evaluate(snapshot, evaluatedAt);

    expect(result.score).toBeGreaterThan(50);
    expect(result.status).toBe('NOT_READY');
  });
});

function createReadySnapshot(): OtecReadinessSnapshot {
  return {
    organization: { id: '11111111-1111-4111-8111-111111111111', type: 'OTEC', status: 'ACTIVE' },
    profile: { id: '22222222-2222-4222-8222-222222222222', status: 'ACTIVE' },
    settings: {
      requireNch2728: true,
      requiredResolutionTypes: ['ACCREDITATION'],
      qualifyingOfficeTypes: ['HEADQUARTERS', 'OPERATING_OFFICE'],
      expirationWarningDays: [7, 15, 30, 60],
      undatedRecordTreatment: 'WARNING',
    },
    accreditations: [effectiveRecord('accreditation-1', 'ACTIVE')],
    certifications: [
      { ...effectiveRecord('certification-1', 'ACTIVE'), certificationType: 'NCH_2728' },
    ],
    offices: [{ ...effectiveRecord('office-1', 'ACTIVE'), officeType: 'HEADQUARTERS' }],
    representatives: [{ ...effectiveRecord('representative-1', 'ACTIVE'), active: true }],
    resolutions: [
      {
        ...effectiveRecord('resolution-1', 'ACTIVE'),
        resolutionType: 'ACCREDITATION',
        superseded: false,
      },
    ],
  };
}

function effectiveRecord(id: string, status: string) {
  return {
    id,
    status,
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validUntil: new Date('2027-01-01T00:00:00.000Z'),
  };
}

function first<T>(items: T[]): T {
  const item = items[0];
  if (!item) throw new Error('Test fixture requires one item');
  return item;
}
