import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { SenceRepository } from '../../domain/repositories/sence.repository.js';
import type { SenceDeclarationDto, UpdateSenceStatusDto } from '../dto/sence.dto.js';
import { SenceMapper } from '../mappers/sence.mapper.js';
import { loadSenceDeclaration, requireOrganizationId } from './sence-use-case.helpers.js';

export class UpdateSenceDeclarationStatusUseCase {
  constructor(
    private readonly repository: SenceRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    declarationId: string,
    input: UpdateSenceStatusDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<SenceDeclarationDto> {
    const organizationId = requireOrganizationId(context);
    const declaration = await loadSenceDeclaration({ repository: this.repository, declarationId, organizationId });
    const before = declaration.toPrimitives();
    declaration.updateStatus(input.status, {
      statusReason: input.reason ?? null,
      statusComments: input.comments ?? null,
      statusUpdatedBy: context.actorUserId,
    });
    await this.repository.update(declaration);
    await this.auditLogger.record({
      organizationId,
      actorUserId: context.actorUserId,
      entityType: 'SENCE_DECLARATION',
      entityId: declarationId,
      action: 'sence.declaration.status.update',
      metadata: { status: input.status },
      before,
      after: declaration.toPrimitives(),
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    return SenceMapper.toDto(declaration);
  }
}
