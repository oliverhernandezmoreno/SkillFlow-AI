import {
  BadRequestError,
  ModuleUnavailableError,
  NotFoundError,
} from '../../../../shared/domain/errors.js';
import type {
  OtecResolution,
  OtecResolutionType,
} from '../../domain/entities/otec-resolution.entity.js';
import type { OtecResolutionRepository } from '../../domain/repositories/otec-regulatory-record.repositories.js';
import type { UpdateOtecResolutionDto } from '../dto/otec-resolution.dto.js';
import type { OtecComplianceUnitOfWork } from '../ports/otec-compliance-unit-of-work.js';
import type { ModuleAccessEvaluator, TimeProvider } from './otec-office-use-case.helpers.js';
import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import type { OtecCompliancePermission } from '../services/otec-compliance-authorization.policy.js';
import { requireOtecPermission } from './otec-profile-use-case.helpers.js';
export type { ModuleAccessEvaluator, TimeProvider };
export {
  auditContext,
  requireOtecPermission,
  requireTenantId,
} from './otec-accreditation-use-case.helpers.js';
export async function requireResolutionAccess(
  access: ModuleAccessEvaluator,
  organizationId: string,
  at: Date,
  context: UseCaseContext,
  permission: OtecCompliancePermission,
) {
  const decision = await access.evaluate({
    organizationId,
    evaluatedAt: at,
    moduleCode: 'OTEC_COMPLIANCE',
    feature: 'resolutions',
  });
  if (!decision.allowed)
    throw new ModuleUnavailableError(
      `OTEC Compliance resolutions are unavailable: ${decision.reason}`,
    );
  requireOtecPermission(context, permission);
}
export function parseResolutionType(value: string): OtecResolutionType {
  if (
    ![
      'ACCREDITATION',
      'AUTHORIZATION',
      'MODIFICATION',
      'SUSPENSION',
      'CESSATION',
      'OTHER',
    ].includes(value)
  )
    throw new BadRequestError('Unsupported OTEC resolution type');
  return value as OtecResolutionType;
}
export async function findResolutionOrThrow(
  repository: OtecResolutionRepository,
  organizationId: string,
  id: string,
): Promise<OtecResolution> {
  const item = await repository.findById(organizationId, id);
  if (!item) throw new NotFoundError('The OTEC resolution was not found');
  return item;
}
export async function validateResolutionDocument(
  uow: OtecComplianceUnitOfWork,
  organizationId: string,
  documentId: string | null | undefined,
) {
  if (documentId && !(await uow.documentOwnership.belongsToTenant(organizationId, documentId)))
    throw new NotFoundError('The resolution document was not found');
}
export function rejectResolutionScopeChanges(
  input: UpdateOtecResolutionDto,
  organizationId: string,
  profileId: string,
) {
  if (input.organizationId !== undefined && input.organizationId !== organizationId)
    throw new BadRequestError('organizationId cannot be changed');
  if (input.otecProfileId !== undefined && input.otecProfileId !== profileId)
    throw new BadRequestError('otecProfileId cannot be changed');
  if (input.supersedesResolutionId !== undefined)
    throw new BadRequestError('Supersession cannot be changed by an administrative update');
}
