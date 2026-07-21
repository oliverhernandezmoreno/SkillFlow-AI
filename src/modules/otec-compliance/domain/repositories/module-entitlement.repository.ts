import type { ModuleEntitlement, ModuleCode } from '../entities/module-entitlement.entity.js';

export interface ModuleEntitlementRepository {
  findByModuleCode(input: {
    organizationId: string;
    moduleCode: ModuleCode;
  }): Promise<ModuleEntitlement | null>;
}
