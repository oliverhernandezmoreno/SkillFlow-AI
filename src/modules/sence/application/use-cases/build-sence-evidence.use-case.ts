import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { SenceRepository } from '../../domain/repositories/sence.repository.js';
import { SenceEvidenceBuilder } from '../../domain/services/sence-evidence-builder.js';
import type { SenceEvidenceDto } from '../dto/sence.dto.js';
import { loadSenceSnapshot, requireOrganizationId } from './sence-use-case.helpers.js';

export class BuildSenceEvidenceUseCase {
  constructor(
    private readonly repository: SenceRepository,
    private readonly evidenceBuilder: SenceEvidenceBuilder = new SenceEvidenceBuilder(),
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    declarationId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<SenceEvidenceDto> {
    const organizationId = requireOrganizationId(context);
    const snapshot = await loadSenceSnapshot({ repository: this.repository, declarationId, organizationId });
    const result = this.evidenceBuilder.build(snapshot);
    await this.auditLogger.record({
      organizationId,
      actorUserId: context.actorUserId,
      entityType: 'SENCE_DECLARATION',
      entityId: declarationId,
      action: 'sence.declaration.evidence.build',
      metadata: { evidenceTypes: result.evidence.map((item) => item.type) },
      after: result,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    return result;
  }
}
