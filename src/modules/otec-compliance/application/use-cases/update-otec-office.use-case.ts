import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { OtecOfficeDto, UpdateOtecOfficeDto } from '../dto/otec-office.dto.js';
import { OtecOfficeMapper } from '../mappers/otec-office.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  auditContext,
  findOfficeOrThrow,
  mapOfficeDomainError,
  parseOfficeType,
  rejectOfficeScopeChanges,
  requireOfficeAccess,
  requireTenantId,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './otec-office-use-case.helpers.js';
export class UpdateOtecOfficeUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    id: string,
    input: UpdateOtecOfficeDto,
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
      rejectOfficeScopeChanges(input, organizationId, before.otecProfileId);
      const {
        expectedVersion,
        organizationId: ignoredOrganization,
        otecProfileId: ignoredProfile,
        officeType,
        ...changes
      } = input;
      void ignoredOrganization;
      void ignoredProfile;
      try {
        office.update(
          {
            ...changes,
            ...(officeType === undefined ? {} : { officeType: parseOfficeType(officeType) }),
          },
          operationTime,
        );
      } catch (error) {
        mapOfficeDomainError(error);
      }
      await uow.otecOfficeRepository.update(office, expectedVersion);
      const after = OtecOfficeMapper.toDto(office);
      await uow.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'OtecOffice',
        entityId: id,
        action: 'OTEC_OFFICE_UPDATED',
        metadata: { internalRecordOnly: true },
        before,
        after,
      });
      return after;
    });
  }
}
