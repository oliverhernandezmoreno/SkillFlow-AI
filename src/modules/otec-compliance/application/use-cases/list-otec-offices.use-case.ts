import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../shared/application/pagination.js';
import type { OtecOfficeFilters } from '../../domain/repositories/otec-regulatory-record.repositories.js';
import type { OtecOfficeDto } from '../dto/otec-office.dto.js';
import { OtecOfficeMapper } from '../mappers/otec-office.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  requireOfficeAccess,
  requireTenantId,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './otec-office-use-case.helpers.js';
export class ListOtecOfficesUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    filters: OtecOfficeFilters,
    pagination: PaginationInput,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<PaginatedResult<OtecOfficeDto>> {
    const organizationId = requireTenantId(context);
    await requireOfficeAccess(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.read',
    );
    return this.transactions.run(async (uow) => {
      const result = await uow.otecOfficeRepository.search(organizationId, filters, pagination);
      return { data: result.data.map(OtecOfficeMapper.toDto), meta: result.meta };
    });
  }
}
