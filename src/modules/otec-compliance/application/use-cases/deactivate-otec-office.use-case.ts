import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { DeactivateOtecOfficeDto, OtecOfficeDto } from '../dto/otec-office.dto.js';
import { OtecOfficeMapper } from '../mappers/otec-office.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  auditContext,
  findOfficeOrThrow,
  requireOfficeAccess,
  requireTenantId,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './otec-office-use-case.helpers.js';
export class DeactivateOtecOfficeUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    id: string,
    input: DeactivateOtecOfficeDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OtecOfficeDto> {
    const organizationId = requireTenantId(context);
    const operationTime = this.now();
    await requireOfficeAccess(
      this.access,
      organizationId,
      operationTime,
      context,
      'otec_compliance.office.manage',
    );
    return this.transactions.run(async (uow) => {
      const office = await findOfficeOrThrow(uow.otecOfficeRepository, organizationId, id);
      const before = OtecOfficeMapper.toDto(office);
      office.deactivate(operationTime);
      await uow.otecOfficeRepository.update(office, input.expectedVersion);
      const after = OtecOfficeMapper.toDto(office);
      await uow.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'OtecOffice',
        entityId: id,
        action: 'OTEC_OFFICE_DEACTIVATED',
        metadata: { internalRecordOnly: true, reason: input.reason ?? null },
        before,
        after,
      });
      return after;
    });
  }
}
