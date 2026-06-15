import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import type { EvaluationDto, UpdateEvaluationDto } from '../dto/evaluation.dto.js';
import { EvaluationMapper } from '../mappers/evaluation.mapper.js';

export class UpdateEvaluationUseCase {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    evaluationId: string,
    input: UpdateEvaluationDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<EvaluationDto> {
    if (!context.organizationId) {
      throw new NotFoundError('Evaluation not found');
    }
    const evaluation = await this.evaluationRepository.findById(evaluationId, context.organizationId);
    if (!evaluation) {
      throw new NotFoundError('Evaluation not found');
    }

    const before = EvaluationMapper.toDto(evaluation);
    evaluation.update(input);
    await this.evaluationRepository.update(evaluation);
    const updated = EvaluationMapper.toDto(evaluation);
    await this.auditLogger.record({
      organizationId: context.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'EVALUATION',
      entityId: evaluation.id,
      action: 'evaluation.update',
      metadata: {},
      before,
      after: updated,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return updated;
  }
}
