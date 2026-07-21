import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { QualityCertification } from '../../domain/entities/quality-certification.entity.js';
import type {
  CreateQualityCertificationDto,
  QualityCertificationDto,
} from '../dto/quality-certification.dto.js';
import { QualityCertificationMapper } from '../mappers/quality-certification.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  auditContext,
  parseCertificationType,
  requireCertificationEntitlement,
  requireTenantId,
  validateDocumentOwnership,
} from './quality-certification-use-case.helpers.js';
import type { ModuleAccessEvaluator, TimeProvider } from './otec-office-use-case.helpers.js';
export class CreateQualityCertificationUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    input: CreateQualityCertificationDto,
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
    const certificationType = parseCertificationType(input.certificationType);
    return this.transactions.run(async (uow) => {
      const profile = await uow.otecProfileRepository.findById(organizationId, input.otecProfileId);
      if (profile?.toPrimitives().registrationStatus !== 'ACTIVE')
        throw new NotFoundError('The active OTEC profile was not found');
      await validateDocumentOwnership(uow, organizationId, input.documentId);
      const item = QualityCertification.create({
        organizationId,
        otecProfileId: input.otecProfileId,
        certificationType,
        certificationNumber: input.certificationNumber,
        certifyingEntity: input.certifyingEntity,
        scope: input.scope ?? null,
        issuedAt: input.issuedAt ?? null,
        validFrom: input.validFrom ?? null,
        validUntil: input.validUntil ?? null,
        documentId: input.documentId ?? null,
        notes: input.notes ?? null,
      });
      await uow.qualityCertificationRepository.save(item);
      const after = QualityCertificationMapper.toDto(item);
      await uow.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'QualityCertification',
        entityId: item.id,
        action: 'QUALITY_CERTIFICATION_CREATED',
        metadata: { internalRecordOnly: true },
        after,
      });
      return after;
    });
  }
}
