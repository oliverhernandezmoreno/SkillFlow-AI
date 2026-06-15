import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { CertificateRepository } from '../../domain/repositories/certificate.repository.js';
import type { CertificateDto } from '../dto/certificate.dto.js';
import { CertificateMapper } from '../mappers/certificate.mapper.js';
import { loadCertificate, requireOrganizationId } from './certificate-use-case.helpers.js';

export class GetCertificateUseCase {
  constructor(private readonly repository: CertificateRepository) {}

  async execute(
    certificateId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<CertificateDto> {
    const organizationId = requireOrganizationId(context);
    const certificate = await loadCertificate({ repository: this.repository, certificateId, organizationId });

    return CertificateMapper.toDto(certificate);
  }
}
