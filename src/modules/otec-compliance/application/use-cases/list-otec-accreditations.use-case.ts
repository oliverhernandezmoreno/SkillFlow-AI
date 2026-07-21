import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../shared/application/pagination.js';
import type { OtecAccreditationStatus } from '../../domain/entities/otec-accreditation.entity.js';
import type {
  EffectiveRecordFilters,
  OtecAccreditationRepository,
} from '../../domain/repositories/otec-regulatory-record.repositories.js';
import type { OtecAccreditationDto } from '../dto/otec-accreditation.dto.js';
import { OtecAccreditationMapper } from '../mappers/otec-accreditation.mapper.js';
import {
  requireAccreditationEntitlement,
  requireTenantId,
} from './otec-accreditation-use-case.helpers.js';
import type { ModuleAccessEvaluator, TimeProvider } from './otec-office-use-case.helpers.js';

export class ListOtecAccreditationsUseCase {
  constructor(
    private readonly repository: OtecAccreditationRepository,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    filters: EffectiveRecordFilters<OtecAccreditationStatus>,
    pagination: PaginationInput,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<PaginatedResult<OtecAccreditationDto>> {
    const organizationId = requireTenantId(context);
    await requireAccreditationEntitlement(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.read',
    );
    const result = await this.repository.search(organizationId, filters, pagination);
    return { data: result.data.map(OtecAccreditationMapper.toDto), meta: result.meta };
  }
}
