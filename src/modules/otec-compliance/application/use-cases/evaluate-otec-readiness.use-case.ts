import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ModuleUnavailableError, NotFoundError } from '../../../../shared/domain/errors.js';
import {
  OtecReadinessEvaluator,
  type OtecReadinessResult,
} from '../../domain/services/otec-readiness-evaluator.js';
import type { OtecReadinessSnapshotReadPort } from '../ports/otec-readiness-snapshot-read.port.js';
import { requireOtecPermission, requireTenantId } from './otec-profile-use-case.helpers.js';
import type { ModuleAccessEvaluator } from './otec-office-use-case.helpers.js';
import type { OtecCompliancePermission } from '../services/otec-compliance-authorization.policy.js';

export interface EvaluateOtecReadinessInput {
  otecProfileId: string;
  evaluationDate?: Date | undefined;
}

export type ReadinessClock = () => Date;

export class EvaluateOtecReadinessUseCase {
  constructor(
    private readonly snapshots: OtecReadinessSnapshotReadPort,
    private readonly access: ModuleAccessEvaluator,
    private readonly clock: ReadinessClock = () => new Date(),
    private readonly evaluator = new OtecReadinessEvaluator(),
  ) {}

  async execute(
    input: EvaluateOtecReadinessInput,
    context: UseCaseContext = anonymousUseCaseContext,
    permission: OtecCompliancePermission = 'otec_compliance.readiness.evaluate',
  ): Promise<OtecReadinessResult> {
    const organizationId = requireTenantId(context);
    const evaluatedAt = input.evaluationDate ?? this.clock();
    const access = await this.access.evaluate({
      organizationId,
      evaluatedAt,
      moduleCode: 'OTEC_COMPLIANCE',
      feature: 'readiness',
    });
    if (!access.allowed) {
      throw new ModuleUnavailableError(
        `OTEC Compliance readiness is unavailable: ${access.reason}`,
      );
    }
    requireOtecPermission(context, permission);
    const snapshot = await this.snapshots.load({
      organizationId,
      otecProfileId: input.otecProfileId,
      evaluatedAt,
    });
    if (!snapshot) throw new NotFoundError('The OTEC profile was not found');
    return this.evaluator.evaluate(snapshot, evaluatedAt);
  }
}
