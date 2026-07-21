import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { OtecProfileDto, UpdateOtecProfileDto } from '../dto/otec-profile.dto.js';
import { OtecProfileMapper } from '../mappers/otec-profile.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  OtecComplianceAuthorizationPolicy,
  otecCompliancePermissions,
} from '../services/otec-compliance-authorization.policy.js';
import { findCurrentTenantProfileOrThrow } from './otec-profile-use-case.helpers.js';

export class UpdateOtecProfileUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly authorization: OtecComplianceAuthorizationPolicy,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async execute(
    input: UpdateOtecProfileDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OtecProfileDto> {
    const organizationId = await this.authorization.authorize(context, {
      feature: 'profile',
      permission: otecCompliancePermissions.profileManage,
      evaluatedAt: this.clock(),
    });
    return this.transactions.run(async (unitOfWork) => {
      const profile = await findCurrentTenantProfileOrThrow(
        unitOfWork.otecProfileRepository,
        organizationId,
      );
      const before = OtecProfileMapper.toDto(profile);
      const { expectedVersion, ...changes } = input;
      profile.update(changes);
      await unitOfWork.otecProfileRepository.update(profile, expectedVersion);
      const after = OtecProfileMapper.toDto(profile);
      await unitOfWork.auditLogger.record({
        organizationId,
        actorUserId: context.actorUserId,
        entityType: 'OtecProfile',
        entityId: profile.id,
        action: 'OTEC_PROFILE_UPDATED',
        metadata: { expectedVersion },
        before,
        after,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
      });
      return after;
    });
  }
}
