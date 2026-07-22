import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors.js';
import type { OtecCompliancePermission } from '../services/otec-compliance-authorization.policy.js';
import type { OtecProfile } from '../../domain/entities/otec-profile.entity.js';
import type { OtecProfileRepository } from '../../domain/repositories/otec-profile.repository.js';
import { logOtecAuthorizationDenial } from '../services/otec-authorization-diagnostic.logger.js';

export function requireTenantId(context: UseCaseContext): string {
  if (!context.organizationId || !context.actorUserId) {
    throw new ForbiddenError('An authenticated tenant is required');
  }
  return context.organizationId;
}

export function requireOtecPermission(
  context: UseCaseContext,
  permission: OtecCompliancePermission,
): void {
  if (!context.permissions?.includes(permission)) {
    logOtecAuthorizationDenial({
      source: 'requireOtecPermission',
      operation: 'requireOtecPermission',
      requiredPermission: permission,
      context,
    });
    throw new ForbiddenError('Permission denied');
  }
}

export async function findTenantProfileOrThrow(
  repository: OtecProfileRepository,
  organizationId: string,
  profileId: string,
): Promise<OtecProfile> {
  const profile = await repository.findById(organizationId, profileId);
  if (!profile) throw new NotFoundError('The OTEC profile was not found');
  return profile;
}

export async function findCurrentTenantProfileOrThrow(
  repository: OtecProfileRepository,
  organizationId: string,
): Promise<OtecProfile> {
  const profile = await repository.findCurrentByOrganizationId(organizationId);
  if (!profile) throw new NotFoundError('The OTEC profile was not found');
  return profile;
}
