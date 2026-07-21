import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import {
  BadRequestError,
  ModuleUnavailableError,
  NotFoundError,
} from '../../../../shared/domain/errors.js';
import {
  OtecExpirationClassifier,
  type OtecExpirationCandidate,
  type OtecExpirationState,
} from '../../domain/services/otec-expiration-classifier.js';
import type { OtecReadinessSnapshot } from '../../domain/services/otec-readiness-evaluator.js';
import type { OtecReadinessSnapshotReadPort } from '../ports/otec-readiness-snapshot-read.port.js';
import { requireOtecPermission, requireTenantId } from './otec-profile-use-case.helpers.js';
import type { ModuleAccessEvaluator } from './otec-office-use-case.helpers.js';
import type { ReadinessClock } from './evaluate-otec-readiness.use-case.js';

export interface GetExpiringComplianceItemsInput {
  otecProfileId: string;
  evaluationDate?: Date | undefined;
  expiringWithinDays?: number | undefined;
  states?: OtecExpirationState[] | undefined;
}

export interface ExpiringComplianceItem {
  entityId: string;
  entityType: string;
  state: OtecExpirationState;
  status: string;
  validFrom: Date | null;
  validUntil: Date | null;
  daysUntilExpiration: number | null;
  evaluatedAt: Date;
}

const statePriority: Record<OtecExpirationState, number> = {
  EXPIRED: 0,
  SUSPENDED: 1,
  REVOKED: 2,
  EXPIRING_SOON: 3,
  UNDATED: 4,
};

export class GetExpiringComplianceItemsUseCase {
  constructor(
    private readonly snapshots: OtecReadinessSnapshotReadPort,
    private readonly access: ModuleAccessEvaluator,
    private readonly clock: ReadinessClock = () => new Date(),
    private readonly classifier = new OtecExpirationClassifier(),
  ) {}

  async execute(
    input: GetExpiringComplianceItemsInput,
    pagination: PaginationInput,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<PaginatedResult<ExpiringComplianceItem>> {
    const organizationId = requireTenantId(context);
    const evaluatedAt = input.evaluationDate ?? this.clock();
    if (
      input.expiringWithinDays !== undefined &&
      (!Number.isInteger(input.expiringWithinDays) || input.expiringWithinDays < 0)
    ) {
      throw new BadRequestError('expiringWithinDays must be a non-negative integer');
    }
    const access = await this.access.evaluate({
      organizationId,
      evaluatedAt,
      moduleCode: 'OTEC_COMPLIANCE',
      feature: 'expirations',
    });
    if (!access.allowed)
      throw new ModuleUnavailableError(
        `OTEC Compliance expirations are unavailable: ${access.reason}`,
      );
    requireOtecPermission(context, 'otec_compliance.read');
    const snapshot = await this.snapshots.load({
      organizationId,
      otecProfileId: input.otecProfileId,
      evaluatedAt,
    });
    if (!snapshot) throw new NotFoundError('The OTEC profile was not found');
    const window =
      input.expiringWithinDays ?? Math.max(0, ...snapshot.settings.expirationWarningDays);
    const allowedStates = new Set(
      input.states ?? ['EXPIRED', 'EXPIRING_SOON', 'UNDATED', 'SUSPENDED', 'REVOKED'],
    );
    const items = candidates(snapshot)
      .map((candidate) => this.classifier.classify(candidate, evaluatedAt, window))
      .filter(
        (item): item is NonNullable<typeof item> => item !== null && allowedStates.has(item.state),
      )
      .map(
        (item): ExpiringComplianceItem => ({
          entityId: item.id,
          entityType: item.entityType,
          state: item.state,
          status: item.status,
          validFrom: item.validFrom,
          validUntil: item.validUntil,
          daysUntilExpiration: item.daysUntilExpiration,
          evaluatedAt,
        }),
      )
      .sort(compareItems);
    const start = (pagination.page - 1) * pagination.pageSize;
    return {
      data: items.slice(start, start + pagination.pageSize),
      meta: createPaginationMeta(pagination, items.length),
    };
  }
}

function candidates(snapshot: OtecReadinessSnapshot): OtecExpirationCandidate[] {
  return [
    ...snapshot.accreditations.map((record) => ({ ...record, entityType: 'OTEC_ACCREDITATION' })),
    ...snapshot.certifications.map((record) => ({
      ...record,
      entityType: 'QUALITY_CERTIFICATION',
    })),
    ...snapshot.offices.map((record) => ({ ...record, entityType: 'OTEC_OFFICE' })),
    ...snapshot.representatives.map((record) => ({
      ...record,
      entityType: 'LEGAL_REPRESENTATIVE',
    })),
    ...snapshot.resolutions.map((record) => ({ ...record, entityType: 'OTEC_RESOLUTION' })),
  ];
}

function compareItems(left: ExpiringComplianceItem, right: ExpiringComplianceItem): number {
  return (
    statePriority[left.state] - statePriority[right.state] ||
    (left.daysUntilExpiration ?? Number.MAX_SAFE_INTEGER) -
      (right.daysUntilExpiration ?? Number.MAX_SAFE_INTEGER) ||
    left.entityType.localeCompare(right.entityType) ||
    left.entityId.localeCompare(right.entityId)
  );
}
