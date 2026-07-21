import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import {
  BadRequestError,
  ModuleUnavailableError,
  NotFoundError,
} from '../../../../shared/domain/errors.js';
import type { ModuleAccessEvaluator } from './otec-office-use-case.helpers.js';
import type { OtecAccreditation } from '../../domain/entities/otec-accreditation.entity.js';
import type { OtecAccreditationRepository } from '../../domain/repositories/otec-regulatory-record.repositories.js';
import type { UpdateOtecAccreditationDto } from '../dto/otec-accreditation.dto.js';
import { requireOtecPermission } from './otec-profile-use-case.helpers.js';
import type { OtecCompliancePermission } from '../services/otec-compliance-authorization.policy.js';

export { requireOtecPermission, requireTenantId } from './otec-profile-use-case.helpers.js';

export async function requireAccreditationEntitlement(
  access: ModuleAccessEvaluator,
  organizationId: string,
  evaluatedAt: Date,
  context: UseCaseContext,
  permission: OtecCompliancePermission,
): Promise<void> {
  const decision = await access.evaluate({
    organizationId,
    evaluatedAt,
    moduleCode: 'OTEC_COMPLIANCE',
    feature: 'accreditations',
  });
  if (!decision.allowed)
    throw new ModuleUnavailableError(
      `OTEC Compliance accreditations are unavailable: ${decision.reason}`,
    );
  requireOtecPermission(context, permission);
}

export async function findAccreditationOrThrow(
  repository: OtecAccreditationRepository,
  organizationId: string,
  accreditationId: string,
): Promise<OtecAccreditation> {
  const accreditation = await repository.findById(organizationId, accreditationId);
  if (!accreditation) throw new NotFoundError('The OTEC accreditation was not found');
  return accreditation;
}

export function rejectScopeChanges(
  input: UpdateOtecAccreditationDto,
  organizationId: string,
  profileId: string,
): void {
  if (input.organizationId !== undefined && input.organizationId !== organizationId) {
    throw new BadRequestError('organizationId cannot be changed');
  }
  if (input.otecProfileId !== undefined && input.otecProfileId !== profileId) {
    throw new BadRequestError('otecProfileId cannot be changed');
  }
}

export function auditContext(context: UseCaseContext) {
  return {
    actorUserId: context.actorUserId,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  };
}
