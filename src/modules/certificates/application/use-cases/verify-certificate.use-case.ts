import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import type { CertificateRepository } from '../../domain/repositories/certificate.repository.js';
import type { CertificateVerificationDto } from '../dto/certificate.dto.js';
import { CertificateMapper } from '../mappers/certificate.mapper.js';

export class VerifyCertificateUseCase {
  constructor(
    private readonly repository: CertificateRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(input: {
    verificationCode: string;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
  }): Promise<CertificateVerificationDto> {
    const certificate = await this.repository.findByVerificationCode(input.verificationCode);
    const result = CertificateMapper.toVerificationDto(certificate);
    await this.auditLogger.record({
      organizationId: certificate?.toPrimitives().organizationId ?? null,
      actorUserId: null,
      entityType: 'CERTIFICATE',
      entityId: certificate?.id ?? null,
      action: 'certificate.verify',
      metadata: {
        verificationCode: input.verificationCode,
        valid: result.valid,
      },
      after: result,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });

    return result;
  }
}
