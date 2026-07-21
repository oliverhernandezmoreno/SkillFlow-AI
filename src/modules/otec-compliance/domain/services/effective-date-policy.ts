import type { EffectiveRecord } from './otec-readiness-evaluator.js';

const millisecondsPerDay = 86_400_000;

export function isEffectiveActive(record: EffectiveRecord, evaluatedAt: Date): boolean {
  const evaluationDay = utcDayNumber(evaluatedAt);
  return (
    record.status === 'ACTIVE' &&
    (record.validFrom === null || utcDayNumber(record.validFrom) <= evaluationDay) &&
    (record.validUntil === null || utcDayNumber(record.validUntil) >= evaluationDay)
  );
}

export function calendarDaysUntil(validUntil: Date | null, evaluatedAt: Date): number | null {
  return validUntil === null ? null : utcDayNumber(validUntil) - utcDayNumber(evaluatedAt);
}

export function startsAfter(record: EffectiveRecord, evaluatedAt: Date): boolean {
  return record.validFrom !== null && utcDayNumber(record.validFrom) > utcDayNumber(evaluatedAt);
}

function utcDayNumber(value: Date): number {
  return Math.floor(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()) / millisecondsPerDay,
  );
}
