import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { CertificateRepository } from '../../domain/repositories/certificate.repository.js';
import type { CertificateDto, RevokeCertificateDto } from '../dto/certificate.dto.js';
import { CertificateMapper } from '../mappers/certificate.mapper.js';
import { loadCertificate, requireOrganizationId } from './certificate-use-case.helpers.js';

export class RevokeCertificateUseCase {
  constructor(
    private readonly repository: CertificateRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    certificateId: string,
    input: RevokeCertificateDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<CertificateDto> {
    const organizationId = requireOrganizationId(context);
    const certificate = await loadCertificate({ repository: this.repository, certificateId, organizationId });
    const before = certificate.toPrimitives();
    certificate.revoke(input.reason);
    await this.repository.update(certificate);
    await this.auditLogger.record({
      organizationId,
      actorUserId: context.actorUserId,
      entityType: 'CERTIFICATE',
      entityId: certificate.id,
      action: 'certificate.revoke',
      metadata: { reason: input.reason },
      before,
      after: certificate.toPrimitives(),
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return CertificateMapper.toDto(certificate);
  }
}
