import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { CertificateRepository } from '../../domain/repositories/certificate.repository.js';
import type { CertificateDocumentDto } from '../dto/certificate.dto.js';
import { CertificateMapper } from '../mappers/certificate.mapper.js';
import { loadCertificate, requireOrganizationId } from './certificate-use-case.helpers.js';

export class GenerateCertificateDocumentUseCase {
  constructor(
    private readonly repository: CertificateRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    certificateId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<CertificateDocumentDto> {
    const organizationId = requireOrganizationId(context);
    const certificate = await loadCertificate({ repository: this.repository, certificateId, organizationId });
    const props = certificate.toPrimitives();
    const document = await this.repository.createDocumentForCertificate({
      organizationId,
      certificateId,
      fileName: `${props.certificateNumber}.pdf`,
      mimeType: 'application/pdf',
      actorUserId: context.actorUserId,
    });
    certificate.attachDocument(document.id, document.fileUrl);
    await this.repository.update(certificate);
    const result = CertificateMapper.toDocumentDto({ certificateId, document });
    await this.auditLogger.record({
      organizationId,
      actorUserId: context.actorUserId,
      entityType: 'CERTIFICATE',
      entityId: certificateId,
      action: 'certificate.document.generate',
      metadata: {
        documentId: document.id,
        storageProvider: 'LOCAL_STUB',
      },
      after: result,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return result;
  }
}
