import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { OtecProfileRepository } from '../../domain/repositories/otec-profile.repository.js';
import type { OtecProfileDto } from '../dto/otec-profile.dto.js';
import { OtecProfileMapper } from '../mappers/otec-profile.mapper.js';
import {
  OtecComplianceAuthorizationPolicy,
  otecCompliancePermissions,
} from '../services/otec-compliance-authorization.policy.js';
import { findCurrentTenantProfileOrThrow } from './otec-profile-use-case.helpers.js';

export class GetOtecProfileUseCase {
  constructor(
    private readonly repository: OtecProfileRepository,
    private readonly authorization: OtecComplianceAuthorizationPolicy,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async execute(context: UseCaseContext = anonymousUseCaseContext): Promise<OtecProfileDto> {
    const organizationId = await this.authorization.authorize(context, {
      feature: 'profile',
      permission: otecCompliancePermissions.read,
      evaluatedAt: this.clock(),
    });
    const profile = await findCurrentTenantProfileOrThrow(this.repository, organizationId);
    return OtecProfileMapper.toDto(profile);
  }
}
