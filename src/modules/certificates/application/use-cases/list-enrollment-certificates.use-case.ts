import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { CertificateRepository } from '../../domain/repositories/certificate.repository.js';
import type { CertificateListDto } from '../dto/certificate.dto.js';
import { ListCertificatesUseCase } from './list-certificates.use-case.js';

export class ListEnrollmentCertificatesUseCase {
  constructor(private readonly repository: CertificateRepository) {}

  async execute(
    enrollmentId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<CertificateListDto> {
    return new ListCertificatesUseCase(this.repository).execute({ enrollmentId }, context);
  }
}
