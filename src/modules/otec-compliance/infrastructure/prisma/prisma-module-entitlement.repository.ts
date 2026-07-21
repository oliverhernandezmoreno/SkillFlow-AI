import type { PrismaClient } from '@prisma/client';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { ModuleEntitlement } from '../../domain/entities/module-entitlement.entity.js';
import type { ModuleEntitlementRepository } from '../../domain/repositories/module-entitlement.repository.js';

export class PrismaModuleEntitlementRepository implements ModuleEntitlementRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findByModuleCode(input: {
    organizationId: string;
    moduleCode: 'OTEC_COMPLIANCE';
  }): Promise<ModuleEntitlement | null> {
    const record = await this.prisma.tenantModuleEntitlement.findFirst({
      where: { ...input, deletedAt: null },
    });
    if (!record) return null;
    return ModuleEntitlement.rehydrate({
      ...record,
      enabledFeatures: Array.isArray(record.enabledFeatures)
        ? record.enabledFeatures.filter((value): value is string => typeof value === 'string')
        : [],
    });
  }
}
