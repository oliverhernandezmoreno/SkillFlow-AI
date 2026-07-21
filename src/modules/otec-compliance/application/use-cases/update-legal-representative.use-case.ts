import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type {
  LegalRepresentativeDto,
  UpdateLegalRepresentativeDto,
} from '../dto/legal-representative.dto.js';
import { LegalRepresentativeMapper } from '../mappers/legal-representative.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  auditContext,
  findRepresentativeOrThrow,
  mapRepresentativeDomainError,
  rejectRepresentativeScopeChanges,
  requireRepresentativeAccess,
  requireTenantId,
  validateAppointmentDocument,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './legal-representative-use-case.helpers.js';
export class UpdateLegalRepresentativeUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    id: string,
    input: UpdateLegalRepresentativeDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<LegalRepresentativeDto> {
    const organizationId = requireTenantId(context);
    const operationTime = this.now();
    await requireRepresentativeAccess(
      this.access,
      organizationId,
      operationTime,
      context,
      'otec_compliance.representative.manage',
    );
    return this.transactions.run(async (uow) => {
      const item = await findRepresentativeOrThrow(
        uow.legalRepresentativeRepository,
        organizationId,
        id,
      );
      const profileId = item.toPrimitives().otecProfileId;
      rejectRepresentativeScopeChanges(input, organizationId, profileId);
      await validateAppointmentDocument(uow, organizationId, input.appointmentDocumentId);
      const before = LegalRepresentativeMapper.toSafeAudit(item);
      const {
        expectedVersion,
        organizationId: ignoredOrganization,
        otecProfileId: ignoredProfile,
        ...changes
      } = input;
      void ignoredOrganization;
      void ignoredProfile;
      try {
        item.update(changes, operationTime);
      } catch (error) {
        mapRepresentativeDomainError(error);
      }
      await uow.legalRepresentativeRepository.update(item, expectedVersion);
      const after = LegalRepresentativeMapper.toSafeAudit(item);
      await uow.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'LegalRepresentative',
        entityId: id,
        action: 'LEGAL_REPRESENTATIVE_UPDATED',
        metadata: { internalRecordOnly: true, syntacticRutValidationOnly: true },
        before,
        after,
      });
      return LegalRepresentativeMapper.toDto(item);
    });
  }
}
