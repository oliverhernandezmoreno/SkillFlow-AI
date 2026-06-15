import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { UnauthorizedError } from '../../../../shared/domain/errors.js';
import { EvaluationQuestion } from '../../domain/entities/evaluation-question.entity.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import type { CreateEvaluationQuestionDto, EvaluationQuestionDto } from '../dto/evaluation.dto.js';
import { EvaluationMapper } from '../mappers/evaluation.mapper.js';
import { loadEvaluation } from './evaluation-use-case.helpers.js';

export class AddEvaluationQuestionUseCase {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    evaluationId: string,
    input: CreateEvaluationQuestionDto,
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
    const question = EvaluationQuestion.create({
      organizationId: context.organizationId,
      evaluationId,
      ...input,
    });
    await this.evaluationRepository.addQuestion(question);
    const created = EvaluationMapper.toQuestionDto(question);
    await this.auditLogger.record({
      organizationId: context.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'EVALUATION',
      entityId: evaluationId,
      action: 'evaluation.question.add',
      metadata: { questionId: question.id },
      after: created,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    return created;
  }
}
