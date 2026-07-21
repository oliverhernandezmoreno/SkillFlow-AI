import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { OtecReadinessStatus } from '../../domain/services/otec-readiness-evaluator.js';
import type { EvaluateOtecReadinessInput } from './evaluate-otec-readiness.use-case.js';
import { EvaluateOtecReadinessUseCase } from './evaluate-otec-readiness.use-case.js';

export interface OtecComplianceSummary {
  organizationId: string;
  otecProfileId: string | null;
  status: OtecReadinessStatus;
  evaluatedAt: Date;
  policyVersion: string;
  blockingCount: number;
  warningCount: number;
  passedRuleCount: number;
  missingItemCount: number;
  expiringItemCount: number;
  metadata: { basis: 'INTERNAL_CONFIGURED_RECORDS'; officialValidation: false };
}

export class GetOtecComplianceSummaryUseCase {
  constructor(private readonly readiness: EvaluateOtecReadinessUseCase) {}

  async execute(
    input: EvaluateOtecReadinessInput,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OtecComplianceSummary> {
    const result = await this.readiness.execute(input, context, 'otec_compliance.read');
    return {
      organizationId: result.organizationId,
      otecProfileId: result.otecProfileId,
      status: result.status,
      evaluatedAt: result.evaluatedAt,
      policyVersion: result.policyVersion,
      blockingCount: result.blockingIssues.length,
      warningCount: result.warnings.length,
      passedRuleCount: result.passedChecks.length,
      missingItemCount: result.missingItems.length,
      expiringItemCount: result.expiringItems.length,
      metadata: result.metadata,
    };
  }
}
