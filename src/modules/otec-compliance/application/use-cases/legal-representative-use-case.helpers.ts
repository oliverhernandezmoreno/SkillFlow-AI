import type { LegalRepresentative } from '../../domain/entities/legal-representative.entity.js';
import type { LegalRepresentativeRepository } from '../../domain/repositories/otec-regulatory-record.repositories.js';
import {
  BadRequestError,
  ModuleUnavailableError,
  NotFoundError,
} from '../../../../shared/domain/errors.js';
import type { UpdateLegalRepresentativeDto } from '../dto/legal-representative.dto.js';
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
export async function requireRepresentativeAccess(
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
    feature: 'representatives',
  });
  if (!decision.allowed)
    throw new ModuleUnavailableError(
      `OTEC Compliance representatives are unavailable: ${decision.reason}`,
    );
  requireOtecPermission(context, permission);
}
export async function findRepresentativeOrThrow(
  repository: LegalRepresentativeRepository,
  organizationId: string,
  id: string,
): Promise<LegalRepresentative> {
  const item = await repository.findById(organizationId, id);
  if (!item) throw new NotFoundError('The legal representative was not found');
  return item;
}
export function rejectRepresentativeScopeChanges(
  input: UpdateLegalRepresentativeDto,
  organizationId: string,
  profileId: string,
): void {
  if (input.organizationId !== undefined && input.organizationId !== organizationId)
    throw new BadRequestError('organizationId cannot be changed');
  if (input.otecProfileId !== undefined && input.otecProfileId !== profileId)
    throw new BadRequestError('otecProfileId cannot be changed');
}
export async function validateAppointmentDocument(
  uow: OtecComplianceUnitOfWork,
  organizationId: string,
  documentId: string | null | undefined,
): Promise<void> {
  if (documentId && !(await uow.documentOwnership.belongsToTenant(organizationId, documentId)))
    throw new NotFoundError('The appointment document was not found');
}
export function mapRepresentativeDomainError(error: unknown): never {
  if (
    error instanceof Error &&
    (error.message.includes('Invalid RUT') ||
      error.message.includes('Invalid email') ||
      error.message.includes('validFrom') ||
      error.message.includes('required'))
  )
    throw new BadRequestError(error.message);
  throw error;
}
