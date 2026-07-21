import { calendarDaysUntil, isEffectiveActive } from './effective-date-policy.js';

export type OtecReadinessStatus = 'READY' | 'READY_WITH_WARNINGS' | 'NOT_READY';
export type ReadinessSeverity = 'BLOCKING' | 'WARNING' | 'PASSED';

export interface EffectiveRecord {
  id: string;
  status: string;
  validFrom: Date | null;
  validUntil: Date | null;
}

export interface OtecReadinessSnapshot {
  organization: { id: string; type: string; status: string };
  profile: { id: string; status: string } | null;
  settings: {
    policyVersion?: string | undefined;
    requireNch2728: boolean;
    requiredResolutionTypes: string[];
    qualifyingOfficeTypes: string[];
    expirationWarningDays: number[];
    undatedRecordTreatment: 'BLOCKING' | 'WARNING' | 'ACCEPTED';
  };
  accreditations: EffectiveRecord[];
  certifications: (EffectiveRecord & { certificationType: string })[];
  offices: (EffectiveRecord & { officeType: string })[];
  representatives: (EffectiveRecord & { active: boolean })[];
  resolutions: (EffectiveRecord & { resolutionType: string; superseded: boolean })[];
}

export interface OtecReadinessCheck {
  ruleCode: string;
  category: string;
  entityType: string;
  entityId: string | null;
  severity: ReadinessSeverity;
  message: string;
  validFrom: Date | null;
  validUntil: Date | null;
  daysUntilExpiration: number | null;
  remediation: string;
  evaluatedAt: Date;
}

export interface OtecReadinessResult {
  organizationId: string;
  otecProfileId: string | null;
  evaluatedAt: Date;
  status: OtecReadinessStatus;
  score: number;
  policyVersion: string;
  blockingIssues: OtecReadinessCheck[];
  warnings: OtecReadinessCheck[];
  passedChecks: OtecReadinessCheck[];
  findings: OtecReadinessCheck[];
  expiringItems: OtecReadinessCheck[];
  missingItems: OtecReadinessCheck[];
  metadata: {
    basis: 'INTERNAL_CONFIGURED_RECORDS';
    officialValidation: false;
  };
}

interface RecordRequirementInput {
  checks: OtecReadinessCheck[];
  missingItems: OtecReadinessCheck[];
  expiringItems: OtecReadinessCheck[];
  records: EffectiveRecord[];
  evaluatedAt: Date;
  settings: OtecReadinessSnapshot['settings'];
  ruleCode: string;
  category: string;
  entityType: string;
  missingMessage: string;
  remediation: string;
}

export class OtecReadinessEvaluator {
  evaluate(snapshot: OtecReadinessSnapshot, evaluatedAt: Date): OtecReadinessResult {
    const checks: OtecReadinessCheck[] = [];
    const missingItems: OtecReadinessCheck[] = [];
    const expiringItems: OtecReadinessCheck[] = [];

    this.addPresenceCheck(checks, missingItems, evaluatedAt, {
      passed: snapshot.organization.type === 'OTEC' && snapshot.organization.status === 'ACTIVE',
      ruleCode: 'OTEC-FOUND-001',
      category: 'OTEC_FOUNDATION',
      entityType: 'ORGANIZATION',
      entityId: snapshot.organization.id,
      failure: 'Organization is not internally configured as an active OTEC',
      success: 'Organization is internally configured as an active OTEC',
      remediation: 'Set the active organization type to OTEC after authorized review',
    });
    this.addPresenceCheck(checks, missingItems, evaluatedAt, {
      passed: snapshot.profile?.status === 'ACTIVE',
      ruleCode: 'OTEC-FOUND-002',
      category: 'OTEC_FOUNDATION',
      entityType: 'OTEC_PROFILE',
      entityId: snapshot.profile?.id ?? null,
      failure: 'Active OTEC profile is missing',
      success: 'Active OTEC profile exists',
      remediation: 'Create or reactivate the internal OTEC profile',
    });

    this.evaluateRecordRequirement({
      checks,
      missingItems,
      expiringItems,
      records: snapshot.accreditations,
      evaluatedAt,
      settings: snapshot.settings,
      ruleCode: 'OTEC-ACC-001',
      category: 'OTEC_ACCREDITATION',
      entityType: 'OTEC_ACCREDITATION',
      missingMessage: 'Current active accreditation is missing',
      remediation: 'Register a current active accreditation record',
    });

    if (snapshot.settings.requireNch2728) {
      this.evaluateRecordRequirement({
        checks,
        missingItems,
        expiringItems,
        records: snapshot.certifications.filter(
          (record) => record.certificationType === 'NCH_2728',
        ),
        evaluatedAt,
        settings: snapshot.settings,
        ruleCode: 'OTEC-QUAL-001',
        category: 'QUALITY_CERTIFICATION',
        entityType: 'QUALITY_CERTIFICATION',
        missingMessage: 'Required current NCh2728 certification is missing',
        remediation: 'Register a current NCh2728 certification or validate tenant configuration',
      });
    } else {
      checks.push(
        passedCheck(
          'OTEC-QUAL-001',
          'QUALITY_CERTIFICATION',
          'QUALITY_CERTIFICATION',
          null,
          'NCh2728 is not required by effective tenant configuration',
          evaluatedAt,
        ),
      );
    }

    this.evaluateRecordRequirement({
      checks,
      missingItems,
      expiringItems,
      records: snapshot.offices.filter((record) =>
        snapshot.settings.qualifyingOfficeTypes.includes(record.officeType),
      ),
      evaluatedAt,
      settings: snapshot.settings,
      ruleCode: 'OTEC-OFF-001',
      category: 'OTEC_OFFICE',
      entityType: 'OTEC_OFFICE',
      missingMessage: 'Current active qualifying office is missing',
      remediation: 'Register an active office of a configured qualifying type',
    });
    this.evaluateRecordRequirement({
      checks,
      missingItems,
      expiringItems,
      records: snapshot.representatives.filter((record) => record.active),
      evaluatedAt,
      settings: snapshot.settings,
      ruleCode: 'OTEC-REP-001',
      category: 'LEGAL_REPRESENTATION',
      entityType: 'LEGAL_REPRESENTATIVE',
      missingMessage: 'Current active legal representative is missing',
      remediation: 'Register a current active legal representative',
    });

    for (const resolutionType of snapshot.settings.requiredResolutionTypes) {
      this.evaluateRecordRequirement({
        checks,
        missingItems,
        expiringItems,
        records: snapshot.resolutions.filter(
          (record) => record.resolutionType === resolutionType && !record.superseded,
        ),
        evaluatedAt,
        settings: snapshot.settings,
        ruleCode: 'OTEC-RES-001',
        category: 'ADMINISTRATIVE_RESOLUTION',
        entityType: 'OTEC_RESOLUTION',
        missingMessage: `Current required ${resolutionType} resolution is missing`,
        remediation: `Register a current non-superseded ${resolutionType} resolution`,
      });
    }

    const blockingIssues = checks.filter((check) => check.severity === 'BLOCKING');
    const warnings = checks.filter((check) => check.severity === 'WARNING');
    const passedChecks = checks.filter((check) => check.severity === 'PASSED');
    const score = checks.length === 0 ? 0 : Math.round((passedChecks.length / checks.length) * 100);
    return {
      organizationId: snapshot.organization.id,
      otecProfileId: snapshot.profile?.id ?? null,
      evaluatedAt,
      status:
        blockingIssues.length > 0
          ? 'NOT_READY'
          : warnings.length > 0
            ? 'READY_WITH_WARNINGS'
            : 'READY',
      score,
      policyVersion: snapshot.settings.policyVersion ?? 'UNVERSIONED_INTERNAL_POLICY',
      blockingIssues,
      warnings,
      passedChecks,
      findings: [...blockingIssues, ...warnings, ...passedChecks],
      expiringItems,
      missingItems,
      metadata: { basis: 'INTERNAL_CONFIGURED_RECORDS', officialValidation: false },
    };
  }

  private addPresenceCheck(
    checks: OtecReadinessCheck[],
    missing: OtecReadinessCheck[],
    evaluatedAt: Date,
    input: {
      passed: boolean;
      ruleCode: string;
      category: string;
      entityType: string;
      entityId: string | null;
      failure: string;
      success: string;
      remediation: string;
    },
  ): void {
    const check = input.passed
      ? passedCheck(
          input.ruleCode,
          input.category,
          input.entityType,
          input.entityId,
          input.success,
          evaluatedAt,
        )
      : blockingCheck(
          input.ruleCode,
          input.category,
          input.entityType,
          input.entityId,
          input.failure,
          input.remediation,
          evaluatedAt,
        );
    checks.push(check);
    if (!input.passed) missing.push(check);
  }

  private evaluateRecordRequirement(input: RecordRequirementInput): void {
    const currentRecords = input.records.filter((record) =>
      isEffectiveActive(record, input.evaluatedAt),
    );
    const fullyDated = currentRecords.find(
      (record) => record.validFrom !== null && record.validUntil !== null,
    );
    const current = fullyDated ?? currentRecords[0];
    if (!current) {
      this.addMissingRecord(input);
      return;
    }

    const isUndated = current.validFrom === null || current.validUntil === null;
    if (isUndated && input.settings.undatedRecordTreatment === 'BLOCKING') {
      const finding = blockingCheck(
        input.ruleCode,
        input.category,
        input.entityType,
        current.id,
        'Current item has an open validity boundary that policy treats as blocking',
        input.remediation,
        input.evaluatedAt,
        current,
      );
      input.checks.push(finding);
      input.missingItems.push(finding);
      return;
    }
    if (isUndated && input.settings.undatedRecordTreatment === 'WARNING') {
      const warning = findingForRecord(
        input,
        current,
        'WARNING',
        'Current item has an open validity boundary under the configured warning policy',
        null,
      );
      input.checks.push(warning);
      return;
    }

    const days = calendarDaysUntil(current.validUntil, input.evaluatedAt);
    const maxWarning = Math.max(0, ...input.settings.expirationWarningDays);
    if (days !== null && days >= 0 && days <= maxWarning) {
      const warning = findingForRecord(
        input,
        current,
        'WARNING',
        'Item expires within a configured warning window',
        days,
      );
      input.checks.push(warning);
      input.expiringItems.push(warning);
      return;
    }
    input.checks.push(
      findingForRecord(input, current, 'PASSED', 'Current active item exists', days),
    );
  }

  private addMissingRecord(input: RecordRequirementInput): void {
    const check = blockingCheck(
      input.ruleCode,
      input.category,
      input.entityType,
      null,
      input.missingMessage,
      input.remediation,
      input.evaluatedAt,
    );
    input.checks.push(check);
    input.missingItems.push(check);
  }
}

function findingForRecord(
  input: RecordRequirementInput,
  record: EffectiveRecord,
  severity: ReadinessSeverity,
  message: string,
  daysUntilExpiration: number | null,
): OtecReadinessCheck {
  return {
    ruleCode: input.ruleCode,
    category: input.category,
    entityType: input.entityType,
    entityId: record.id,
    severity,
    message,
    validFrom: record.validFrom,
    validUntil: record.validUntil,
    daysUntilExpiration,
    remediation:
      severity === 'PASSED' ? '' : 'Review and renew the internal antecedent before expiration',
    evaluatedAt: input.evaluatedAt,
  };
}

function passedCheck(
  ruleCode: string,
  category: string,
  entityType: string,
  entityId: string | null,
  message: string,
  evaluatedAt: Date,
): OtecReadinessCheck {
  return {
    ruleCode,
    category,
    entityType,
    entityId,
    severity: 'PASSED',
    message,
    validFrom: null,
    validUntil: null,
    daysUntilExpiration: null,
    remediation: '',
    evaluatedAt,
  };
}

function blockingCheck(
  ruleCode: string,
  category: string,
  entityType: string,
  entityId: string | null,
  message: string,
  remediation: string,
  evaluatedAt: Date,
  record?: EffectiveRecord,
): OtecReadinessCheck {
  return {
    ruleCode,
    category,
    entityType,
    entityId,
    severity: 'BLOCKING',
    message,
    validFrom: record?.validFrom ?? null,
    validUntil: record?.validUntil ?? null,
    daysUntilExpiration: null,
    remediation,
    evaluatedAt,
  };
}
