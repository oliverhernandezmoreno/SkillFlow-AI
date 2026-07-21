import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { OtecOffice } from '../../domain/entities/otec-office.entity.js';
import type { CreateOtecOfficeDto, OtecOfficeDto } from '../dto/otec-office.dto.js';
import { OtecOfficeMapper } from '../mappers/otec-office.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  auditContext,
  mapOfficeDomainError,
  parseOfficeType,
  requireOfficeAccess,
  requireTenantId,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './otec-office-use-case.helpers.js';
export class CreateOtecOfficeUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    input: CreateOtecOfficeDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OtecOfficeDto> {
    const organizationId = requireTenantId(context);
    await requireOfficeAccess(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.office.manage',
    );
    return this.transactions.run(async (uow) => {
      const profile = await uow.otecProfileRepository.findById(organizationId, input.otecProfileId);
      if (profile?.toPrimitives().registrationStatus !== 'ACTIVE')
        throw new NotFoundError('The active OTEC profile was not found');
      const office = createOffice(input, organizationId);
      await uow.otecOfficeRepository.save(office);
      const after = OtecOfficeMapper.toDto(office);
      await uow.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'OtecOffice',
        entityId: office.id,
        action: 'OTEC_OFFICE_CREATED',
        metadata: { internalRecordOnly: true },
        after,
      });
      return after;
    });
  }
}
function createOffice(input: CreateOtecOfficeDto, organizationId: string): OtecOffice {
  try {
    return OtecOffice.create({
      ...input,
      organizationId,
      officeType: parseOfficeType(input.officeType),
    });
  } catch (error) {
    return mapOfficeDomainError(error);
  }
}
