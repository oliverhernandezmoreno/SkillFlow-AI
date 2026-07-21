import { Prisma, type PrismaClient } from '@prisma/client';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import type {
  OrganizationComplianceProjection,
  OrganizationComplianceReadPort,
  TenantDocumentOwnershipPort,
} from '../../application/ports/compliance-reference.ports.js';

export class PrismaOrganizationComplianceReadAdapter implements OrganizationComplianceReadPort {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findById(organizationId: string): Promise<OrganizationComplianceProjection | null> {
    return this.prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: {
        id: true,
        legalName: true,
        tradeName: true,
        taxId: true,
        type: true,
        status: true,
      },
    });
  }
}

export class PrismaTenantDocumentOwnershipAdapter implements TenantDocumentOwnershipPort {
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient = prismaClient) {}

  async belongsToTenant(organizationId: string, documentId: string): Promise<boolean> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, organizationId, deletedAt: null },
      select: { id: true },
    });
    return document !== null;
  }
}
