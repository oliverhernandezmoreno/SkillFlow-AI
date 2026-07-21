import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type {
  QualityCertificationDto,
  UpdateQualityCertificationDto,
} from '../dto/quality-certification.dto.js';
import { QualityCertificationMapper } from '../mappers/quality-certification.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  auditContext,
  findCertificationOrThrow,
  parseCertificationType,
  requireCertificationEntitlement,
  rejectCertificationScopeChanges,
  requireTenantId,
  validateDocumentOwnership,
} from './quality-certification-use-case.helpers.js';
import type { ModuleAccessEvaluator, TimeProvider } from './otec-office-use-case.helpers.js';
export class UpdateQualityCertificationUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    id: string,
    input: UpdateQualityCertificationDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<QualityCertificationDto> {
    const organizationId = requireTenantId(context);
    await requireCertificationEntitlement(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.certification.manage',
    );
    return this.transactions.run(async (uow) => {
      const item = await findCertificationOrThrow(
        uow.qualityCertificationRepository,
        organizationId,
        id,
      );
      const before = QualityCertificationMapper.toDto(item);
      rejectCertificationScopeChanges(input, organizationId, before.otecProfileId);
      await validateDocumentOwnership(uow, organizationId, input.documentId);
      const {
        expectedVersion,
        organizationId: ignoredOrganization,
        otecProfileId: ignoredProfile,
        certificationType,
        ...changes
      } = input;
      void ignoredOrganization;
      void ignoredProfile;
      item.update({
        ...changes,
        ...(certificationType === undefined
          ? {}
          : { certificationType: parseCertificationType(certificationType) }),
      });
      await uow.qualityCertificationRepository.update(item, expectedVersion);
      const after = QualityCertificationMapper.toDto(item);
      await uow.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'QualityCertification',
        entityId: id,
        action: 'QUALITY_CERTIFICATION_UPDATED',
        metadata: { internalRecordOnly: true },
        before,
        after,
      });
      return after;
    });
  }
}
