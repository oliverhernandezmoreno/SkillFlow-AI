import type {
  ModuleAccessDecision,
  ModuleCode,
} from '../../domain/entities/module-entitlement.entity.js';
import type { ModuleEntitlementRepository } from '../../domain/repositories/module-entitlement.repository.js';

export class ModuleEntitlementService {
  constructor(private readonly repository: ModuleEntitlementRepository) {}

  async evaluate(input: {
    organizationId: string;
    evaluatedAt: Date;
    moduleCode?: ModuleCode;
    feature?: string;
  }): Promise<ModuleAccessDecision> {
    const moduleCode = input.moduleCode ?? 'OTEC_COMPLIANCE';
    const entitlement = await this.repository.findByModuleCode({
      organizationId: input.organizationId,
      moduleCode,
    });
    if (!entitlement) {
      return { allowed: false, reason: 'UNAVAILABLE' };
    }

    const access = entitlement.evaluateAccess(input);
    if (!access.allowed || !input.feature) {
      return access;
    }

    const { enabledFeatures } = entitlement.toPrimitives();
    return enabledFeatures.length === 0 || enabledFeatures.includes(input.feature)
      ? access
      : { allowed: false, reason: 'FEATURE_DISABLED' };
  }
}
