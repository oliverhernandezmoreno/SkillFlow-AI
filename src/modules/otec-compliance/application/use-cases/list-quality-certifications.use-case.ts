import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../shared/application/pagination.js';
import type {
  QualityCertificationFilters,
  QualityCertificationRepository,
} from '../../domain/repositories/otec-regulatory-record.repositories.js';
import type { QualityCertificationDto } from '../dto/quality-certification.dto.js';
import { QualityCertificationMapper } from '../mappers/quality-certification.mapper.js';
import {
  requireCertificationEntitlement,
  requireTenantId,
} from './quality-certification-use-case.helpers.js';
import type { ModuleAccessEvaluator, TimeProvider } from './otec-office-use-case.helpers.js';
export class ListQualityCertificationsUseCase {
  constructor(
    private readonly repository: QualityCertificationRepository,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    filters: QualityCertificationFilters,
    pagination: PaginationInput,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<PaginatedResult<QualityCertificationDto>> {
    const organizationId = requireTenantId(context);
    await requireCertificationEntitlement(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.read',
    );
    const result = await this.repository.search(organizationId, filters, pagination);
    return { data: result.data.map(QualityCertificationMapper.toDto), meta: result.meta };
  }
}
