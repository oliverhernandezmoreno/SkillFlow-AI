import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { CertificateRepository } from '../../domain/repositories/certificate.repository.js';
import { CertificateEligibilityService } from '../../domain/services/certificate-eligibility.service.js';
import { CertificateNumberGenerator } from '../../domain/services/certificate-number-generator.js';
import type { CertificateDto, IssueCertificateDto } from '../dto/certificate.dto.js';
import { CertificateMapper } from '../mappers/certificate.mapper.js';
import {
  issueCertificateFromEnrollment,
  requireOrganizationId,
} from './certificate-use-case.helpers.js';

export class IssueCertificateUseCase {
  constructor(
    private readonly repository: CertificateRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
    private readonly eligibilityService: CertificateEligibilityService = new CertificateEligibilityService(),
    private readonly numberGenerator: CertificateNumberGenerator = new CertificateNumberGenerator(),
  ) {}

  async execute(
    input: IssueCertificateDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<CertificateDto> {
    const organizationId = requireOrganizationId(context);
    const certificate = await issueCertificateFromEnrollment({
      repository: this.repository,
      eligibilityService: this.eligibilityService,
      numberGenerator: this.numberGenerator,
      enrollmentId: input.enrollmentId,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      organizationId,
      context,
      auditLogger: this.auditLogger,
    });

    return CertificateMapper.toDto(certificate);
  }
}
