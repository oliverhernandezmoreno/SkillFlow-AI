import { createPagination } from '../../../../shared/application/pagination.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { CertificateStatus } from '../../domain/entities/certificate.entity.js';
import type { CertificateRepository } from '../../domain/repositories/certificate.repository.js';
import type { CertificateListDto } from '../dto/certificate.dto.js';
import { CertificateMapper } from '../mappers/certificate.mapper.js';
import { requireOrganizationId } from './certificate-use-case.helpers.js';

export class ListCertificatesUseCase {
  constructor(private readonly repository: CertificateRepository) {}

  async execute(
    input: {
      page?: number | undefined;
      pageSize?: number | undefined;
      employeeId?: string | undefined;
      enrollmentId?: string | undefined;
      trainingSessionId?: string | undefined;
      status?: CertificateStatus | undefined;
    },
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<CertificateListDto> {
    const organizationId = requireOrganizationId(context);
    const result = await this.repository.search(
      {
        organizationId,
        employeeId: input.employeeId,
        enrollmentId: input.enrollmentId,
        trainingSessionId: input.trainingSessionId,
        status: input.status,
      },
      createPagination(input),
    );

    return CertificateMapper.toListDto(result);
  }
}
