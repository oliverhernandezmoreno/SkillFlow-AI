import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { OtecResolution } from '../../domain/entities/otec-resolution.entity.js';
import type { CreateOtecResolutionDto, OtecResolutionDto } from '../dto/otec-resolution.dto.js';
import { OtecResolutionMapper } from '../mappers/otec-resolution.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  auditContext,
  parseResolutionType,
  requireResolutionAccess,
  requireTenantId,
  validateResolutionDocument,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './otec-resolution-use-case.helpers.js';
export class CreateOtecResolutionUseCase {
  constructor(
    private readonly tx: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    input: CreateOtecResolutionDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OtecResolutionDto> {
    const organizationId = requireTenantId(context);
    await requireResolutionAccess(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.resolution.manage',
    );
    return this.tx.run(async (uow) => {
      const profile = await uow.otecProfileRepository.findById(organizationId, input.otecProfileId);
      if (profile?.toPrimitives().registrationStatus !== 'ACTIVE')
        throw new NotFoundError('The active OTEC profile was not found');
      await validateResolutionDocument(uow, organizationId, input.documentId);
      const item = OtecResolution.create({
        ...input,
        organizationId,
        resolutionType: parseResolutionType(input.resolutionType),
      });
      await uow.otecResolutionRepository.save(item);
      const after = OtecResolutionMapper.toDto(item);
      await uow.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'OtecResolution',
        entityId: item.id,
        action: 'OTEC_RESOLUTION_CREATED',
        metadata: {
          correlationId: context.correlationId ?? null,
          internalRecordOnly: true,
        },
        after,
      });
      return after;
    });
  }
}
