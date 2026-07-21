import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type {
  OtecReadinessCheck,
  OtecReadinessStatus,
} from '../../domain/services/otec-readiness-evaluator.js';
import type { EvaluateOtecReadinessInput } from './evaluate-otec-readiness.use-case.js';
import { EvaluateOtecReadinessUseCase } from './evaluate-otec-readiness.use-case.js';

export interface OtecActivityPreparationValidation {
  canPrepare: boolean;
  status: OtecReadinessStatus;
  evaluatedAt: Date;
  policyVersion: string;
  blockingRuleCodes: string[];
  findings: OtecReadinessCheck[];
  metadata: { purpose: 'INTERNAL_ACTIVITY_PREPARATION'; officialValidation: false };
}

export class ValidateOtecCanPrepareSenceActivityUseCase {
  constructor(private readonly readiness: EvaluateOtecReadinessUseCase) {}

  async execute(
    input: EvaluateOtecReadinessInput,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OtecActivityPreparationValidation> {
    const result = await this.readiness.execute(input, context);
    return {
      canPrepare: result.status !== 'NOT_READY',
      status: result.status,
      evaluatedAt: result.evaluatedAt,
      policyVersion: result.policyVersion,
      blockingRuleCodes: result.blockingIssues.map((finding) => finding.ruleCode),
      findings: result.findings,
      metadata: { purpose: 'INTERNAL_ACTIVITY_PREPARATION', officialValidation: false },
    };
  }
}
