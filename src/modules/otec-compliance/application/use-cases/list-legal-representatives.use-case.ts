import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../shared/application/pagination.js';
import type { LegalRepresentativeFilters } from '../../domain/repositories/otec-regulatory-record.repositories.js';
import type { LegalRepresentativeDto } from '../dto/legal-representative.dto.js';
import { LegalRepresentativeMapper } from '../mappers/legal-representative.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  requireRepresentativeAccess,
  requireTenantId,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './legal-representative-use-case.helpers.js';
export class ListLegalRepresentativesUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    filters: LegalRepresentativeFilters,
    pagination: PaginationInput,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<PaginatedResult<LegalRepresentativeDto>> {
    const organizationId = requireTenantId(context);
    await requireRepresentativeAccess(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.read',
    );
    return this.transactions.run(async (uow) => {
      const result = await uow.legalRepresentativeRepository.search(
        organizationId,
        filters,
        pagination,
      );
      return { data: result.data.map(LegalRepresentativeMapper.toDto), meta: result.meta };
    });
  }
}
