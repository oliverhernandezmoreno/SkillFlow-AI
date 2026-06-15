import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { BadRequestError } from '../../../../shared/domain/errors.js';
import type { SenceRepository } from '../../domain/repositories/sence.repository.js';
import { SenceComplianceValidator } from '../../domain/services/sence-compliance-validator.js';
import type { SenceDeclarationDto } from '../dto/sence.dto.js';
import { SenceMapper } from '../mappers/sence.mapper.js';
import { loadSenceSnapshot, requireOrganizationId } from './sence-use-case.helpers.js';

export class MarkSenceDeclarationReadyUseCase {
  constructor(
    private readonly repository: SenceRepository,
    private readonly validator: SenceComplianceValidator = new SenceComplianceValidator(),
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    declarationId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<SenceDeclarationDto> {
    const organizationId = requireOrganizationId(context);
    const snapshot = await loadSenceSnapshot({ repository: this.repository, declarationId, organizationId });
    const validation = this.validator.validate(snapshot);
    if (!validation.valid) {
      throw new BadRequestError(`SENCE declaration is not ready: ${validation.errors.join('; ')}`);
    }
    const declaration = snapshot.declaration;
    const before = declaration.toPrimitives();
    declaration.markReady({ readinessValidation: validation });
    await this.repository.update(declaration);
    await this.auditLogger.record({
      organizationId,
      actorUserId: context.actorUserId,
      entityType: 'SENCE_DECLARATION',
      entityId: declarationId,
      action: 'sence.declaration.ready',
      metadata: { valid: true },
      before,
      after: declaration.toPrimitives(),
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    return SenceMapper.toDto(declaration);
  }
}
