import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import type { EvaluationDto } from '../dto/evaluation.dto.js';
import { EvaluationMapper } from '../mappers/evaluation.mapper.js';

export class CloseEvaluationUseCase {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    evaluationId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<EvaluationDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }
    const evaluation = await this.evaluationRepository.findById(evaluationId, context.organizationId);
    if (!evaluation) {
      throw new NotFoundError('Evaluation not found');
    }
    const before = EvaluationMapper.toDto(evaluation);
    evaluation.close();
    await this.evaluationRepository.update(evaluation);
    const closed = EvaluationMapper.toDto(evaluation);
    await this.auditLogger.record({
      organizationId: context.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'EVALUATION',
      entityId: evaluationId,
      action: 'evaluation.close',
      metadata: {},
      before,
      after: closed,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    return closed;
  }
}
