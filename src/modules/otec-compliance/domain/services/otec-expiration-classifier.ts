import { calendarDaysUntil, startsAfter } from './effective-date-policy.js';

export type OtecExpirationState = 'EXPIRED' | 'EXPIRING_SOON' | 'UNDATED' | 'SUSPENDED' | 'REVOKED';

export interface OtecExpirationCandidate {
  id: string;
  entityType: string;
  status: string;
  validFrom: Date | null;
  validUntil: Date | null;
}

export interface OtecExpirationClassification extends OtecExpirationCandidate {
  state: OtecExpirationState;
  daysUntilExpiration: number | null;
}

const excludedStatuses = new Set(['INACTIVE', 'DRAFT', 'CANCELLED', 'CLOSED', 'SUPERSEDED']);

export class OtecExpirationClassifier {
  classify(
    candidate: OtecExpirationCandidate,
    evaluatedAt: Date,
    expiringWithinDays: number,
  ): OtecExpirationClassification | null {
    if (excludedStatuses.has(candidate.status) || startsAfter(candidate, evaluatedAt)) return null;
    if (candidate.status === 'SUSPENDED' || candidate.status === 'REVOKED') {
      return {
        ...candidate,
        state: candidate.status,
        daysUntilExpiration: calendarDaysUntil(candidate.validUntil, evaluatedAt),
      };
    }
    if (candidate.status !== 'ACTIVE') return null;
    const daysUntilExpiration = calendarDaysUntil(candidate.validUntil, evaluatedAt);
    if (daysUntilExpiration === null)
      return { ...candidate, state: 'UNDATED', daysUntilExpiration: null };
    if (daysUntilExpiration < 0) return { ...candidate, state: 'EXPIRED', daysUntilExpiration };
    if (daysUntilExpiration <= expiringWithinDays) {
      return { ...candidate, state: 'EXPIRING_SOON', daysUntilExpiration };
    }
    return null;
  }
}
