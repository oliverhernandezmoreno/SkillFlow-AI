import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import type { EvaluationResultDto } from '../dto/evaluation.dto.js';
import { calculateEvaluationResult } from './evaluation-scoring.js';
import { loadEvaluation } from './evaluation-use-case.helpers.js';

export class CalculateEvaluationResultUseCase {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    evaluationId: string,
    input: { employeeId: string },
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<EvaluationResultDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }
    const evaluation = await loadEvaluation({
      evaluationRepository: this.evaluationRepository,
      evaluationId,
      organizationId: context.organizationId,
    });
    const response = await this.evaluationRepository.findResponseByEvaluationAndEmployee(
      evaluationId,
      input.employeeId,
      context.organizationId,
    );
    if (!response) {
      throw new NotFoundError('Evaluation response not found');
    }

    const questions = await this.evaluationRepository.findQuestions(evaluationId, context.organizationId);
    const answers = await this.evaluationRepository.findAnswersByResponse(response.id, context.organizationId);
    const responseProps = response.toPrimitives();
    const result = calculateEvaluationResult({
      evaluation,
      employeeId: input.employeeId,
      enrollmentId: responseProps.enrollmentId,
      questions,
      answers,
    });
    response.updateResult({ score: result.score, passed: result.passed });
    await this.evaluationRepository.updateResponse(response);
    await this.auditLogger.record({
      organizationId: context.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'EVALUATION',
      entityId: evaluationId,
      action: 'evaluation.result.calculate',
      metadata: { responseId: response.id, employeeId: input.employeeId },
      after: result,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    return result;
  }
}
