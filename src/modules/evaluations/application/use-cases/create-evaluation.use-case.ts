import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { TrainingSessionRepository } from '../../../training-sessions/domain/repositories/training-session.repository.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { Evaluation } from '../../domain/entities/evaluation.entity.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import type { CreateEvaluationDto, EvaluationDto } from '../dto/evaluation.dto.js';
import { EvaluationMapper } from '../mappers/evaluation.mapper.js';
import { ensureEvaluationOrganization } from './evaluation-use-case.helpers.js';

export class CreateEvaluationUseCase {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly trainingSessionRepository: TrainingSessionRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    input: CreateEvaluationDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<EvaluationDto> {
    ensureEvaluationOrganization(input.organizationId, context);
    const trainingSession = await this.trainingSessionRepository.findById(
      input.trainingSessionId,
      input.organizationId,
    );
    if (!trainingSession) {
      throw new NotFoundError('Training session not found');
    }

    const evaluation = Evaluation.create(input);
    await this.evaluationRepository.save(evaluation);
    const created = EvaluationMapper.toDto(evaluation);
    await this.auditLogger.record({
      organizationId: input.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'EVALUATION',
      entityId: evaluation.id,
      action: 'evaluation.create',
      metadata: { trainingSessionId: input.trainingSessionId, type: input.type },
      after: created,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return created;
  }
}
