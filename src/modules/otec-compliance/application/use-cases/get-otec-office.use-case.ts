import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { OtecOfficeDto } from '../dto/otec-office.dto.js';
import { OtecOfficeMapper } from '../mappers/otec-office.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  findOfficeOrThrow,
  requireOfficeAccess,
  requireTenantId,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './otec-office-use-case.helpers.js';
export class GetOtecOfficeUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    id: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OtecOfficeDto> {
    const organizationId = requireTenantId(context);
    await requireOfficeAccess(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.read',
    );
    return this.transactions.run(async (uow) =>
      OtecOfficeMapper.toDto(await findOfficeOrThrow(uow.otecOfficeRepository, organizationId, id)),
    );
  }
}
