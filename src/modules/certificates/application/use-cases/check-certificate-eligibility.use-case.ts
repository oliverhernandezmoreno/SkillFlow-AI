import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { CertificateRepository } from '../../domain/repositories/certificate.repository.js';
import { CertificateEligibilityService } from '../../domain/services/certificate-eligibility.service.js';
import type { CertificateEligibilityDto } from '../dto/certificate.dto.js';
import { requireOrganizationId } from './certificate-use-case.helpers.js';

export class CheckCertificateEligibilityUseCase {
  constructor(
    private readonly repository: CertificateRepository,
    private readonly eligibilityService: CertificateEligibilityService = new CertificateEligibilityService(),
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    input: { enrollmentId: string },
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<CertificateEligibilityDto> {
    const organizationId = requireOrganizationId(context);
    const snapshot = await this.repository.getEligibilitySnapshot(organizationId, input.enrollmentId);
    const result = this.eligibilityService.evaluate(snapshot);
    await this.auditLogger.record({
      organizationId,
      actorUserId: context.actorUserId,
      entityType: 'CERTIFICATE',
      entityId: snapshot.existingCertificate?.id ?? null,
      action: 'certificate.eligibility.check',
      metadata: { enrollmentId: input.enrollmentId },
      after: result,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return result;
  }
}
