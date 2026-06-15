import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { SenceRepository } from '../../domain/repositories/sence.repository.js';
import { SenceComplianceValidator } from '../../domain/services/sence-compliance-validator.js';
import type { SenceComplianceValidationDto } from '../dto/sence.dto.js';
import { loadSenceSnapshot, requireOrganizationId } from './sence-use-case.helpers.js';

export class ValidateSenceComplianceUseCase {
  constructor(
    private readonly repository: SenceRepository,
    private readonly validator: SenceComplianceValidator = new SenceComplianceValidator(),
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    declarationId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<SenceComplianceValidationDto> {
    const organizationId = requireOrganizationId(context);
    const snapshot = await loadSenceSnapshot({ repository: this.repository, declarationId, organizationId });
    const result = this.validator.validate(snapshot);
    await this.auditLogger.record({
      organizationId,
      actorUserId: context.actorUserId,
      entityType: 'SENCE_DECLARATION',
      entityId: declarationId,
      action: 'sence.declaration.validate',
      metadata: { valid: result.valid },
      after: result,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    return result;
  }
}
