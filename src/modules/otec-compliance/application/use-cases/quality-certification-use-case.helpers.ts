import {
  BadRequestError,
  ModuleUnavailableError,
  NotFoundError,
} from '../../../../shared/domain/errors.js';
import type { ModuleAccessEvaluator } from './otec-office-use-case.helpers.js';
import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import type { OtecCompliancePermission } from '../services/otec-compliance-authorization.policy.js';
import { requireOtecPermission } from './otec-profile-use-case.helpers.js';
import type {
  QualityCertification,
  QualityCertificationType,
} from '../../domain/entities/quality-certification.entity.js';
import type { QualityCertificationRepository } from '../../domain/repositories/otec-regulatory-record.repositories.js';
import type { OtecComplianceUnitOfWork } from '../ports/otec-compliance-unit-of-work.js';
import type { UpdateQualityCertificationDto } from '../dto/quality-certification.dto.js';
export {
  auditContext,
  requireOtecPermission,
  requireTenantId,
} from './otec-accreditation-use-case.helpers.js';
export async function requireCertificationEntitlement(
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
    feature: 'certifications',
  });
  if (!decision.allowed)
    throw new ModuleUnavailableError(
      `OTEC Compliance certifications are unavailable: ${decision.reason}`,
    );
  requireOtecPermission(context, permission);
}
export function parseCertificationType(value: string): QualityCertificationType {
  if (!['NCH_2728', 'ISO_9001', 'OTHER'].includes(value))
    throw new BadRequestError('Unsupported quality certification type');
  return value as QualityCertificationType;
}
export async function findCertificationOrThrow(
  repository: QualityCertificationRepository,
  organizationId: string,
  id: string,
): Promise<QualityCertification> {
  const item = await repository.findById(organizationId, id);
  if (!item) throw new NotFoundError('The quality certification was not found');
  return item;
}
export function rejectCertificationScopeChanges(
  input: UpdateQualityCertificationDto,
  organizationId: string,
  profileId: string,
): void {
  if (input.organizationId !== undefined && input.organizationId !== organizationId)
    throw new BadRequestError('organizationId cannot be changed');
  if (input.otecProfileId !== undefined && input.otecProfileId !== profileId)
    throw new BadRequestError('otecProfileId cannot be changed');
}
export async function validateDocumentOwnership(
  unitOfWork: OtecComplianceUnitOfWork,
  organizationId: string,
  documentId: string | null | undefined,
): Promise<void> {
  if (
    documentId &&
    !(await unitOfWork.documentOwnership.belongsToTenant(organizationId, documentId))
  )
    throw new NotFoundError('The document was not found');
}
