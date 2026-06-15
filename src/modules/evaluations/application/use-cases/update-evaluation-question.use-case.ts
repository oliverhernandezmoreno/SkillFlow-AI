import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import type { EvaluationQuestionDto, UpdateEvaluationQuestionDto } from '../dto/evaluation.dto.js';
import { EvaluationMapper } from '../mappers/evaluation.mapper.js';
import { loadEvaluation } from './evaluation-use-case.helpers.js';

export class UpdateEvaluationQuestionUseCase {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    evaluationId: string,
    questionId: string,
    input: UpdateEvaluationQuestionDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<EvaluationQuestionDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }
    await loadEvaluation({
      evaluationRepository: this.evaluationRepository,
      evaluationId,
      organizationId: context.organizationId,
    });
    const question = await this.evaluationRepository.findQuestionById(
      evaluationId,
      questionId,
      context.organizationId,
    );
    if (!question) {
      throw new NotFoundError('Evaluation question not found');
    }

    const before = EvaluationMapper.toQuestionDto(question);
    question.update(input);
    await this.evaluationRepository.updateQuestion(question);
    const updated = EvaluationMapper.toQuestionDto(question);
    await this.auditLogger.record({
      organizationId: context.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'EVALUATION',
      entityId: evaluationId,
      action: 'evaluation.question.update',
      metadata: { questionId },
      before,
      after: updated,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    return updated;
  }
}
