import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { DeactivateOtecProfileDto } from '../dto/otec-profile.dto.js';
import { OtecProfileMapper } from '../mappers/otec-profile.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  OtecComplianceAuthorizationPolicy,
  otecCompliancePermissions,
} from '../services/otec-compliance-authorization.policy.js';
import { findCurrentTenantProfileOrThrow } from './otec-profile-use-case.helpers.js';

export class DeactivateOtecProfileUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly authorization: OtecComplianceAuthorizationPolicy,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async execute(
    input: DeactivateOtecProfileDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<void> {
    const organizationId = await this.authorization.authorize(context, {
      feature: 'profile',
      permission: otecCompliancePermissions.profileManage,
      evaluatedAt: this.clock(),
    });
    await this.transactions.run(async (unitOfWork) => {
      const profile = await findCurrentTenantProfileOrThrow(
        unitOfWork.otecProfileRepository,
        organizationId,
      );
      const before = OtecProfileMapper.toDto(profile);
      profile.deactivate();
      await unitOfWork.otecProfileRepository.update(profile, input.expectedVersion);
      await unitOfWork.auditLogger.record({
        organizationId,
        actorUserId: context.actorUserId,
        entityType: 'OtecProfile',
        entityId: profile.id,
        action: 'OTEC_PROFILE_DEACTIVATED',
        metadata: { expectedVersion: input.expectedVersion },
        before,
        after: OtecProfileMapper.toDto(profile),
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
      });
    });
  }
}
