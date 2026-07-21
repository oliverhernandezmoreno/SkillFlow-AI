import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type {
  DeactivateQualityCertificationDto,
  QualityCertificationDto,
} from '../dto/quality-certification.dto.js';
import { QualityCertificationMapper } from '../mappers/quality-certification.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  auditContext,
  findCertificationOrThrow,
  requireCertificationEntitlement,
  requireTenantId,
} from './quality-certification-use-case.helpers.js';
import type { ModuleAccessEvaluator, TimeProvider } from './otec-office-use-case.helpers.js';
export class DeactivateQualityCertificationUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    id: string,
    input: DeactivateQualityCertificationDto,
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
      item.deactivate();
      await uow.qualityCertificationRepository.update(item, input.expectedVersion);
      const after = QualityCertificationMapper.toDto(item);
      await uow.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'QualityCertification',
        entityId: id,
        action: 'QUALITY_CERTIFICATION_DEACTIVATED',
        metadata: {},
        before,
        after,
      });
      return after;
    });
  }
}
