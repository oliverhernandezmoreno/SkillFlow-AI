import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { LegalRepresentativeDto } from '../dto/legal-representative.dto.js';
import { LegalRepresentativeMapper } from '../mappers/legal-representative.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  findRepresentativeOrThrow,
  requireRepresentativeAccess,
  requireTenantId,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './legal-representative-use-case.helpers.js';
export class GetLegalRepresentativeUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    id: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<LegalRepresentativeDto> {
    const organizationId = requireTenantId(context);
    await requireRepresentativeAccess(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.read',
    );
    return this.transactions.run(async (uow) =>
      LegalRepresentativeMapper.toDto(
        await findRepresentativeOrThrow(uow.legalRepresentativeRepository, organizationId, id),
      ),
    );
  }
}
