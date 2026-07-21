import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { OtecResolutionDto, UpdateOtecResolutionDto } from '../dto/otec-resolution.dto.js';
import { OtecResolutionMapper } from '../mappers/otec-resolution.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  auditContext,
  findResolutionOrThrow,
  parseResolutionType,
  rejectResolutionScopeChanges,
  requireResolutionAccess,
  requireTenantId,
  validateResolutionDocument,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './otec-resolution-use-case.helpers.js';
export class UpdateOtecResolutionUseCase {
  constructor(
    private readonly tx: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    id: string,
    input: UpdateOtecResolutionDto,
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
      rejectResolutionScopeChanges(input, organizationId, item.toPrimitives().otecProfileId);
      await validateResolutionDocument(uow, organizationId, input.documentId);
      const before = OtecResolutionMapper.toDto(item);
      const {
        expectedVersion,
        organizationId: ignoredOrganization,
        otecProfileId: ignoredProfile,
        supersedesResolutionId: ignoredSupersession,
        resolutionType,
        ...changes
      } = input;
      void ignoredOrganization;
      void ignoredProfile;
      void ignoredSupersession;
      item.updateAdministrativeData(
        {
          ...changes,
          ...(resolutionType === undefined
            ? {}
            : { resolutionType: parseResolutionType(resolutionType) }),
        },
        at,
      );
      await uow.otecResolutionRepository.update(item, expectedVersion);
      const after = OtecResolutionMapper.toDto(item);
      await uow.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'OtecResolution',
        entityId: id,
        action: 'OTEC_RESOLUTION_UPDATED',
        metadata: {
          correlationId: context.correlationId ?? null,
          expectedVersion,
          internalRecordOnly: true,
        },
        before,
        after,
      });
      return after;
    });
  }
}
