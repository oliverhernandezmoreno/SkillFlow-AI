import { describe, expect, it } from 'vitest';

import { OtecReadinessEvaluator, type OtecReadinessSnapshot } from './otec-readiness-evaluator.js';

const evaluationDate = new Date('2026-07-17T12:00:00.000Z');
const evaluator = new OtecReadinessEvaluator();

describe('OtecReadinessEvaluator integral scenarios', () => {
  it('1 returns READY for a complete internally configured snapshot', () => {
    expect(evaluate().status).toBe('READY');
  });

  it('2 returns READY_WITH_WARNINGS with explainable expiring evidence', () => {
    const snapshot = readySnapshot();
    first(snapshot.certifications).validUntil = new Date('2026-07-30T12:00:00.000Z');
    const result = evaluate(snapshot);
    expect(result.status).toBe('READY_WITH_WARNINGS');
    expect(result.warnings[0]).toMatchObject({
      ruleCode: 'OTEC-QUAL-001',
      category: 'QUALITY_CERTIFICATION',
      severity: 'WARNING',
      evaluatedAt: evaluationDate,
    });
    expect(result.warnings[0]?.remediation).not.toBe('');
  });

  it('3 blocks an inactive profile with exactly the foundation rule', () => {
    const snapshot = readySnapshot();
    snapshot.profile = { id: profileId, status: 'INACTIVE' };
    expect(blockingCodes(evaluate(snapshot))).toEqual(['OTEC-FOUND-002']);
  });

  it('4 blocks when no applicable accreditation exists', () => {
    const snapshot = readySnapshot();
    snapshot.accreditations = [];
    expect(blockingCodes(evaluate(snapshot))).toEqual(['OTEC-ACC-001']);
  });

  it.each(['SUSPENDED', 'REVOKED'])('5-6 blocks an accreditation in %s state', (status) => {
    const snapshot = readySnapshot();
    first(snapshot.accreditations).status = status;
    expect(blockingCodes(evaluate(snapshot))).toEqual(['OTEC-ACC-001']);
  });

  it('7 blocks when required NCh2728 evidence is absent', () => {
    const snapshot = readySnapshot();
    snapshot.certifications = [];
    expect(blockingCodes(evaluate(snapshot))).toEqual(['OTEC-QUAL-001']);
  });

  it('8 passes when NCh2728 is not required', () => {
    const snapshot = readySnapshot();
    snapshot.settings.requireNch2728 = false;
    snapshot.certifications = [];
    expect(evaluate(snapshot).status).toBe('READY');
  });

  it.each([
    ['offices', 'OTEC-OFF-001'],
    ['representatives', 'OTEC-REP-001'],
    ['resolutions', 'OTEC-RES-001'],
  ] as const)('9-11 blocks without valid %s', (field, ruleCode) => {
    const snapshot = readySnapshot();
    snapshot[field] = [];
    expect(blockingCodes(evaluate(snapshot))).toEqual([ruleCode]);
  });

  it('12 counts the current terminal resolution and ignores its superseded predecessor', () => {
    const snapshot = readySnapshot();
    snapshot.resolutions.unshift({
      ...effectiveRecord('old-resolution'),
      resolutionType: 'AUTHORIZATION',
      superseded: true,
      status: 'SUPERSEDED',
    });
    expect(evaluate(snapshot).status).toBe('READY');
  });

  it('13 blocks when only a superseded resolution remains', () => {
    const snapshot = readySnapshot();
    snapshot.resolutions = [
      {
        ...effectiveRecord('old-resolution'),
        resolutionType: 'AUTHORIZATION',
        superseded: true,
        status: 'SUPERSEDED',
      },
    ];
    expect(blockingCodes(evaluate(snapshot))).toEqual(['OTEC-RES-001']);
  });

  it('14 cannot be made ready by cross-tenant evidence omitted from the snapshot', () => {
    const snapshot = readySnapshot();
    snapshot.accreditations = [];
    expect(evaluate(snapshot)).toMatchObject({ status: 'NOT_READY' });
    expect(JSON.stringify(evaluate(snapshot))).not.toContain('foreign-tenant-record');
  });

  it('15 cannot be made ready by soft-deleted evidence omitted from the snapshot', () => {
    const snapshot = readySnapshot();
    snapshot.offices = [];
    expect(blockingCodes(evaluate(snapshot))).toEqual(['OTEC-OFF-001']);
  });

  it('16 returns different deterministic historical and current results', () => {
    const snapshot = readySnapshot();
    for (const record of [
      ...snapshot.accreditations,
      ...snapshot.certifications,
      ...snapshot.offices,
      ...snapshot.representatives,
      ...snapshot.resolutions,
    ]) {
      record.validFrom = new Date('2025-01-01T00:00:00.000Z');
      record.validUntil = new Date('2027-01-01T00:00:00.000Z');
    }
    first(snapshot.accreditations).validFrom = new Date('2025-01-01T00:00:00.000Z');
    first(snapshot.accreditations).validUntil = new Date('2025-12-31T23:59:59.999Z');
    expect(evaluator.evaluate(snapshot, new Date('2025-06-01T00:00:00.000Z')).status).toBe('READY');
    expect(evaluate(snapshot).status).toBe('NOT_READY');
  });

  it('17 ignores invalid alternatives when one valid record exists', () => {
    const snapshot = readySnapshot();
    snapshot.accreditations.unshift(
      { ...effectiveRecord('expired'), validUntil: new Date('2025-01-01T00:00:00.000Z') },
      { ...effectiveRecord('suspended'), status: 'SUSPENDED' },
    );
    expect(evaluate(snapshot).status).toBe('READY');
  });

  it('18 identifies the only invalid requirement without unrelated blockers', () => {
    const snapshot = readySnapshot();
    first(snapshot.representatives).active = false;
    expect(blockingCodes(evaluate(snapshot))).toEqual(['OTEC-REP-001']);
  });

  it('uses inclusive UTC date boundaries and changes on the day after validUntil', () => {
    const snapshot = readySnapshot();
    first(snapshot.accreditations).validFrom = evaluationDate;
    first(snapshot.accreditations).validUntil = evaluationDate;
    expect(evaluate(snapshot).blockingIssues).toHaveLength(0);
    expect(evaluator.evaluate(snapshot, new Date('2026-07-18T00:00:00.000Z')).status).toBe(
      'NOT_READY',
    );
  });

  it('evaluates a future date without consulting ambient time', () => {
    expect(evaluator.evaluate(readySnapshot(), new Date('2028-01-01T00:00:00.000Z')).status).toBe(
      'NOT_READY',
    );
  });

  it.each([
    ['ACCEPTED', 'READY'],
    ['WARNING', 'READY_WITH_WARNINGS'],
    ['BLOCKING', 'NOT_READY'],
  ] as const)('applies %s treatment to undated evidence', (treatment, status) => {
    const snapshot = readySnapshot();
    snapshot.settings.undatedRecordTreatment = treatment;
    first(snapshot.accreditations).validUntil = null;
    expect(evaluate(snapshot).status).toBe(status);
  });

  it('returns organization, profile, policy, consolidated findings, and internal-only metadata', () => {
    const result = evaluate();
    expect(result).toMatchObject({
      organizationId,
      otecProfileId: profileId,
      policyVersion: 'policy-v1',
      evaluatedAt: evaluationDate,
      metadata: { basis: 'INTERNAL_CONFIGURED_RECORDS', officialValidation: false },
    });
    expect(result.findings).toEqual([
      ...result.blockingIssues,
      ...result.warnings,
      ...result.passedChecks,
    ]);
  });
});

const organizationId = '31000000-0000-4000-8000-000000000001';
const profileId = '31000000-0000-4000-8000-000000000002';

function evaluate(snapshot = readySnapshot()) {
  return evaluator.evaluate(snapshot, evaluationDate);
}

function blockingCodes(result: ReturnType<typeof evaluate>): string[] {
  return result.blockingIssues.map((finding) => finding.ruleCode);
}

function readySnapshot(): OtecReadinessSnapshot {
  return {
    organization: { id: organizationId, type: 'OTEC', status: 'ACTIVE' },
    profile: { id: profileId, status: 'ACTIVE' },
    settings: {
      policyVersion: 'policy-v1',
      requireNch2728: true,
      requiredResolutionTypes: ['AUTHORIZATION'],
      qualifyingOfficeTypes: ['HEADQUARTERS'],
      expirationWarningDays: [7, 15, 30],
      undatedRecordTreatment: 'ACCEPTED',
    },
    accreditations: [effectiveRecord('accreditation')],
    certifications: [{ ...effectiveRecord('certification'), certificationType: 'NCH_2728' }],
    offices: [{ ...effectiveRecord('office'), officeType: 'HEADQUARTERS' }],
    representatives: [{ ...effectiveRecord('representative'), active: true }],
    resolutions: [
      {
        ...effectiveRecord('terminal-resolution'),
        resolutionType: 'AUTHORIZATION',
        superseded: false,
      },
    ],
  };
}

function effectiveRecord(id: string) {
  return {
    id,
    status: 'ACTIVE',
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validUntil: new Date('2027-01-01T00:00:00.000Z'),
  };
}

function first<T>(items: T[]): T {
  const item = items[0];
  if (!item) throw new Error('Integral readiness fixture requires one item');
  return item;
}
