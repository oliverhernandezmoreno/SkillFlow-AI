import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ConflictError } from '../../../../shared/domain/errors.js';
import { SenceDeclaration } from '../../domain/entities/sence-declaration.entity.js';
import type { SenceRepository } from '../../domain/repositories/sence.repository.js';
import type { CreateSenceDeclarationDto, SenceDeclarationDto } from '../dto/sence.dto.js';
import { SenceMapper } from '../mappers/sence.mapper.js';
import { requireOrganizationId } from './sence-use-case.helpers.js';

export class CreateSenceDeclarationUseCase {
  constructor(
    private readonly repository: SenceRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    input: CreateSenceDeclarationDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<SenceDeclarationDto> {
    const organizationId = requireOrganizationId(context);
    const existing = await this.repository.findByTrainingSession(organizationId, input.trainingSessionId);
    if (existing) {
      throw new ConflictError('SENCE declaration already exists for this training session');
    }
    const declaration = SenceDeclaration.create({ organizationId, ...input });
    await this.repository.save(declaration);
    await this.auditLogger.record({
      organizationId,
      actorUserId: context.actorUserId,
      entityType: 'SENCE_DECLARATION',
      entityId: declaration.id,
      action: 'sence.declaration.create',
      metadata: { trainingSessionId: input.trainingSessionId },
      after: declaration.toPrimitives(),
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    return SenceMapper.toDto(declaration);
  }
}
