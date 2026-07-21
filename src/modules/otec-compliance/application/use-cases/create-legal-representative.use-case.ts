import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { LegalRepresentative } from '../../domain/entities/legal-representative.entity.js';
import type {
  CreateLegalRepresentativeDto,
  LegalRepresentativeDto,
} from '../dto/legal-representative.dto.js';
import { LegalRepresentativeMapper } from '../mappers/legal-representative.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  auditContext,
  mapRepresentativeDomainError,
  requireRepresentativeAccess,
  requireTenantId,
  validateAppointmentDocument,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './legal-representative-use-case.helpers.js';
export class CreateLegalRepresentativeUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    input: CreateLegalRepresentativeDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<LegalRepresentativeDto> {
    const organizationId = requireTenantId(context);
    await requireRepresentativeAccess(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.representative.manage',
    );
    return this.transactions.run(async (uow) => {
      const profile = await uow.otecProfileRepository.findById(organizationId, input.otecProfileId);
      if (profile?.toPrimitives().registrationStatus !== 'ACTIVE')
        throw new NotFoundError('The active OTEC profile was not found');
      await validateAppointmentDocument(uow, organizationId, input.appointmentDocumentId);
      const item = createRepresentative(input, organizationId);
      await uow.legalRepresentativeRepository.save(item);
      const after = LegalRepresentativeMapper.toDto(item);
      await uow.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'LegalRepresentative',
        entityId: item.id,
        action: 'LEGAL_REPRESENTATIVE_CREATED',
        metadata: { internalRecordOnly: true, syntacticRutValidationOnly: true },
        after: LegalRepresentativeMapper.toSafeAudit(item),
      });
      return after;
    });
  }
}
function createRepresentative(
  input: CreateLegalRepresentativeDto,
  organizationId: string,
): LegalRepresentative {
  try {
    return LegalRepresentative.create({ ...input, organizationId });
  } catch (error) {
    return mapRepresentativeDomainError(error);
  }
}
