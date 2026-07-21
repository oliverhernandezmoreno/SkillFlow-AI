import type { ModuleAccessDecision } from '../../domain/entities/module-entitlement.entity.js';
import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import type { OtecCompliancePermission } from '../services/otec-compliance-authorization.policy.js';
import { requireOtecPermission } from './otec-profile-use-case.helpers.js';
import type { OtecOffice, OtecOfficeType } from '../../domain/entities/otec-office.entity.js';
import type { OtecOfficeRepository } from '../../domain/repositories/otec-regulatory-record.repositories.js';
import {
  BadRequestError,
  ModuleUnavailableError,
  NotFoundError,
} from '../../../../shared/domain/errors.js';
import type { UpdateOtecOfficeDto } from '../dto/otec-office.dto.js';
export {
  auditContext,
  requireOtecPermission,
  requireTenantId,
} from './otec-accreditation-use-case.helpers.js';
export interface ModuleAccessEvaluator {
  evaluate(input: {
    organizationId: string;
    evaluatedAt: Date;
    moduleCode?: 'OTEC_COMPLIANCE';
    feature?: string;
  }): Promise<ModuleAccessDecision>;
}
export type TimeProvider = () => Date;
export async function requireOfficeAccess(
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
    feature: 'offices',
  });
  if (!decision.allowed)
    throw new ModuleUnavailableError(`OTEC Compliance offices are unavailable: ${decision.reason}`);
  requireOtecPermission(context, permission);
}
export function parseOfficeType(value: string): OtecOfficeType {
  if (!['HEADQUARTERS', 'BRANCH', 'OPERATING_OFFICE', 'TRAINING_SITE', 'OTHER'].includes(value))
    throw new BadRequestError('Unsupported OTEC office type');
  return value as OtecOfficeType;
}
export async function findOfficeOrThrow(
  repository: OtecOfficeRepository,
  organizationId: string,
  id: string,
): Promise<OtecOffice> {
  const office = await repository.findById(organizationId, id);
  if (!office) throw new NotFoundError('The OTEC office was not found');
  return office;
}
export function rejectOfficeScopeChanges(
  input: UpdateOtecOfficeDto,
  organizationId: string,
  profileId: string,
): void {
  if (input.organizationId !== undefined && input.organizationId !== organizationId)
    throw new BadRequestError('organizationId cannot be changed');
  if (input.otecProfileId !== undefined && input.otecProfileId !== profileId)
    throw new BadRequestError('otecProfileId cannot be changed');
}
export function mapOfficeDomainError(error: unknown): never {
  if (
    error instanceof Error &&
    !(error instanceof BadRequestError) &&
    (error.message.includes('required') || error.message.includes('validFrom'))
  )
    throw new BadRequestError(error.message);
  throw error;
}
