import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../shared/application/pagination.js';
import type { OtecResolutionFilters } from '../../domain/repositories/otec-regulatory-record.repositories.js';
import type { OtecResolutionDto } from '../dto/otec-resolution.dto.js';
import { OtecResolutionMapper } from '../mappers/otec-resolution.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  requireResolutionAccess,
  requireTenantId,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './otec-resolution-use-case.helpers.js';
export class ListOtecResolutionsUseCase {
  constructor(
    private readonly tx: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    filters: OtecResolutionFilters,
    pagination: PaginationInput,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<PaginatedResult<OtecResolutionDto>> {
    const organizationId = requireTenantId(context);
    await requireResolutionAccess(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.read',
    );
    return this.tx.run(async (uow) => {
      const result = await uow.otecResolutionRepository.search(organizationId, filters, pagination);
      return { data: result.data.map(OtecResolutionMapper.toDto), meta: result.meta };
    });
  }
}
