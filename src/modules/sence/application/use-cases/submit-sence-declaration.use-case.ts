import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { SenceRepository } from '../../domain/repositories/sence.repository.js';
import type { SenceDeclarationDto, SubmitSenceDeclarationDto } from '../dto/sence.dto.js';
import { SenceMapper } from '../mappers/sence.mapper.js';
import { loadSenceDeclaration, requireOrganizationId } from './sence-use-case.helpers.js';

export class SubmitSenceDeclarationUseCase {
  constructor(
    private readonly repository: SenceRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    declarationId: string,
    input: SubmitSenceDeclarationDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<SenceDeclarationDto> {
    const organizationId = requireOrganizationId(context);
    const declaration = await loadSenceDeclaration({ repository: this.repository, declarationId, organizationId });
    const before = declaration.toPrimitives();
    declaration.submit({
      submissionMode: 'MANUAL_STUB',
      submittedBy: context.actorUserId,
      comments: input.comments ?? null,
    });
    await this.repository.update(declaration);
    await this.auditLogger.record({
      organizationId,
      actorUserId: context.actorUserId,
      entityType: 'SENCE_DECLARATION',
      entityId: declarationId,
      action: 'sence.declaration.submit',
      metadata: { submissionMode: 'MANUAL_STUB' },
      before,
      after: declaration.toPrimitives(),
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    return SenceMapper.toDto(declaration);
  }
}
