import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { BadRequestError, NotFoundError } from '../../../../shared/domain/errors.js';
import type {
  SupersedeOtecResolutionDto,
  SupersedeOtecResolutionResult,
} from '../dto/otec-resolution.dto.js';
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
export class SupersedeOtecResolutionUseCase {
  constructor(
    private readonly tx: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    input: SupersedeOtecResolutionDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<SupersedeOtecResolutionResult> {
    const organizationId = requireTenantId(context);
    const at = this.now();
    await requireResolutionAccess(
      this.access,
      organizationId,
      at,
      context,
      'otec_compliance.resolution.manage',
    );
    if (input.replacedResolutionId === input.replacementResolutionId)
      throw new BadRequestError('A resolution cannot supersede itself');
    return this.tx.run(async (uow) => {
      const replaced = await findResolutionOrThrow(
        uow.otecResolutionRepository,
        organizationId,
        input.replacedResolutionId,
      );
      const replacement = await findResolutionOrThrow(
        uow.otecResolutionRepository,
        organizationId,
        input.replacementResolutionId,
      );
      const replacedBefore = OtecResolutionMapper.toDto(replaced);
      const replacementBefore = OtecResolutionMapper.toDto(replacement);
      if (replacedBefore.otecProfileId !== replacementBefore.otecProfileId)
        throw new NotFoundError('The replacement resolution was not found');
      if (replacedBefore.status !== 'ACTIVE')
        throw new BadRequestError('Only an active resolution can be superseded');
      if (replacementBefore.status !== 'ACTIVE')
        throw new BadRequestError('Only an active resolution can be used as a replacement');
      replacement.supersede(replaced.id, at);
      replaced.markSuperseded(at);
      await uow.otecResolutionRepository.supersede(
        replacement,
        replaced,
        input.replacementExpectedVersion,
        input.replacedExpectedVersion,
      );
      const result = {
        replaced: OtecResolutionMapper.toDto(replaced),
        replacement: OtecResolutionMapper.toDto(replacement),
      };
      await uow.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'OtecResolution',
        entityId: replacement.id,
        action: 'OTEC_RESOLUTION_SUPERSEDED',
        metadata: {
          correlationId: context.correlationId ?? null,
          expectedVersion: input.replacementExpectedVersion,
          replacedExpectedVersion: input.replacedExpectedVersion,
          replacedResolutionId: replaced.id,
          reason: input.reason ?? null,
          internalRecordOnly: true,
        },
        before: { replaced: replacedBefore, replacement: replacementBefore },
        after: result,
      });
      return result;
    });
  }
}
