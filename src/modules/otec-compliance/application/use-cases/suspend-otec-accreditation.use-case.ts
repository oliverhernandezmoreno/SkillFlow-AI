import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type {
  OtecAccreditationDto,
  TransitionOtecAccreditationDto,
} from '../dto/otec-accreditation.dto.js';
import { OtecAccreditationMapper } from '../mappers/otec-accreditation.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  auditContext,
  findAccreditationOrThrow,
  requireAccreditationEntitlement,
  requireTenantId,
} from './otec-accreditation-use-case.helpers.js';
import type { ModuleAccessEvaluator, TimeProvider } from './otec-office-use-case.helpers.js';

export class SuspendOtecAccreditationUseCase {
  constructor(
    private readonly transactionManager: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    id: string,
    input: TransitionOtecAccreditationDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OtecAccreditationDto> {
    const organizationId = requireTenantId(context);
    await requireAccreditationEntitlement(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.accreditation.manage',
    );
    return this.transactionManager.run(async (unitOfWork) => {
      const accreditation = await findAccreditationOrThrow(
        unitOfWork.otecAccreditationRepository,
        organizationId,
        id,
      );
      const before = OtecAccreditationMapper.toDto(accreditation);
      accreditation.suspend();
      await unitOfWork.otecAccreditationRepository.update(accreditation, input.expectedVersion);
      const after = OtecAccreditationMapper.toDto(accreditation);
      await unitOfWork.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'OtecAccreditation',
        entityId: id,
        action: 'OTEC_ACCREDITATION_SUSPENDED',
        metadata: { reason: input.reason ?? null },
        before,
        after,
      });
      return after;
    });
  }
}
