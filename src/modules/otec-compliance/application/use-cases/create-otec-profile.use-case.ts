import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ConflictError, ForbiddenError } from '../../../../shared/domain/errors.js';
import { OtecProfile } from '../../domain/entities/otec-profile.entity.js';
import type { CreateOtecProfileDto, OtecProfileDto } from '../dto/otec-profile.dto.js';
import { OtecProfileMapper } from '../mappers/otec-profile.mapper.js';
import type { OrganizationComplianceReadPort } from '../ports/compliance-reference.ports.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  OtecComplianceAuthorizationPolicy,
  otecCompliancePermissions,
} from '../services/otec-compliance-authorization.policy.js';

export class CreateOtecProfileUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly organizationReadPort: OrganizationComplianceReadPort,
    private readonly authorization: OtecComplianceAuthorizationPolicy,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async execute(
    input: CreateOtecProfileDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OtecProfileDto> {
    const organizationId = await this.authorization.authorize(context, {
      feature: 'profile',
      permission: otecCompliancePermissions.profileManage,
      evaluatedAt: this.clock(),
    });
    const organization = await this.organizationReadPort.findById(organizationId);
    if (organization?.type !== 'OTEC' || organization.status !== 'ACTIVE') {
      throw new ForbiddenError('An active OTEC organization is required');
    }
    return this.transactions.run(async (unitOfWork) => {
      const existing = await unitOfWork.otecProfileRepository.search(
        organizationId,
        { status: 'ACTIVE' },
        { page: 1, pageSize: 1 },
      );
      if (existing.meta.total > 0) throw new ConflictError('An active OTEC profile already exists');
      const profile = OtecProfile.create({ organizationId, ...input });
      await unitOfWork.otecProfileRepository.save(profile);
      const result = OtecProfileMapper.toDto(profile);
      await unitOfWork.auditLogger.record({
        organizationId,
        actorUserId: context.actorUserId,
        entityType: 'OtecProfile',
        entityId: profile.id,
        action: 'OTEC_PROFILE_CREATED',
        metadata: {},
        after: result,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
      });
      return result;
    });
  }
}
