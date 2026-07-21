import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import { ForbiddenError, ModuleUnavailableError } from '../../../../shared/domain/errors.js';
import type { ModuleAccessDecision } from '../../domain/entities/module-entitlement.entity.js';

export const otecCompliancePermissions = {
  read: 'otec_compliance.read',
  profileManage: 'otec_compliance.profile.manage',
  accreditationManage: 'otec_compliance.accreditation.manage',
  certificationManage: 'otec_compliance.certification.manage',
  officeManage: 'otec_compliance.office.manage',
  representativeManage: 'otec_compliance.representative.manage',
  resolutionManage: 'otec_compliance.resolution.manage',
  readinessEvaluate: 'otec_compliance.readiness.evaluate',
} as const;

export type OtecCompliancePermission =
  (typeof otecCompliancePermissions)[keyof typeof otecCompliancePermissions];

export interface OtecModuleAccessEvaluator {
  evaluate(input: {
    organizationId: string;
    evaluatedAt: Date;
    moduleCode?: 'OTEC_COMPLIANCE';
    feature?: string;
  }): Promise<ModuleAccessDecision>;
}

export class OtecComplianceAuthorizationPolicy {
  constructor(private readonly access: OtecModuleAccessEvaluator) {}

  async authorize(
    context: UseCaseContext,
    requirement: {
      feature: string;
      permission: OtecCompliancePermission;
      evaluatedAt: Date;
    },
  ): Promise<string> {
    if (!context.organizationId || !context.actorUserId) {
      throw new ForbiddenError('An authenticated OTEC Compliance context is required');
    }
    const decision = await this.access.evaluate({
      organizationId: context.organizationId,
      evaluatedAt: requirement.evaluatedAt,
      moduleCode: 'OTEC_COMPLIANCE',
      feature: requirement.feature,
    });
    if (!decision.allowed) {
      throw new ModuleUnavailableError(
        `OTEC Compliance ${requirement.feature} is unavailable: ${decision.reason}`,
      );
    }
    if (!context.permissions?.includes(requirement.permission)) {
      throw new ForbiddenError('Permission denied');
    }
    return context.organizationId;
  }
}
