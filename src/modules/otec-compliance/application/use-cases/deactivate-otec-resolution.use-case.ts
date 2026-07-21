import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { DeactivateOtecResolutionDto, OtecResolutionDto } from '../dto/otec-resolution.dto.js';
import { OtecResolutionMapper } from '../mappers/otec-resolution.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  auditContext,
  findResolutionOrThrow,
  requireResolutionAccess,
  requireTenantId,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './otec-resolution-use-case.helpers.js';
export class DeactivateOtecResolutionUseCase {
  constructor(
    private readonly tx: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    id: string,
    input: DeactivateOtecResolutionDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OtecResolutionDto> {
    const organizationId = requireTenantId(context);
    const at = this.now();
    await requireResolutionAccess(
      this.access,
      organizationId,
      at,
      context,
      'otec_compliance.resolution.manage',
    );
    return this.tx.run(async (uow) => {
      const item = await findResolutionOrThrow(uow.otecResolutionRepository, organizationId, id);
      const before = OtecResolutionMapper.toDto(item);
      item.deactivate(at);
      await uow.otecResolutionRepository.update(item, input.expectedVersion);
      const after = OtecResolutionMapper.toDto(item);
      await uow.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'OtecResolution',
        entityId: id,
        action: 'OTEC_RESOLUTION_DEACTIVATED',
        metadata: {
          correlationId: context.correlationId ?? null,
          expectedVersion: input.expectedVersion,
          reason: input.reason ?? null,
          internalRecordOnly: true,
        },
        before,
        after,
      });
      return after;
    });
  }
}
