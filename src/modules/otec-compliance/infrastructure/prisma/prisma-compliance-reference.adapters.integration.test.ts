import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import {
  PrismaOrganizationComplianceReadAdapter,
  PrismaTenantDocumentOwnershipAdapter,
} from './prisma-compliance-reference.adapters.js';

const tenantAId = '30000000-0000-4000-8000-000000000001';
const tenantBId = '30000000-0000-4000-8000-000000000002';

describe('OTEC Compliance reference adapters integration', () => {
  const organizationAdapter = new PrismaOrganizationComplianceReadAdapter(prismaClient);
  const documentAdapter = new PrismaTenantDocumentOwnershipAdapter(prismaClient);
  const documentAId = randomUUID();

  beforeAll(async () => {
    await cleanFixtures();
    await prismaClient.organization.createMany({
      data: [
        {
          id: tenantAId,
          legalName: 'Reference OTEC A',
          taxId: '76.555.555-5',
          email: 'a@example.test',
          type: 'OTEC',
        },
        {
          id: tenantBId,
          legalName: 'Reference OTEC B',
          taxId: '76.666.666-6',
          email: 'b@example.test',
          type: 'OTEC',
        },
      ],
    });
    await prismaClient.document.create({
      data: {
        id: documentAId,
        organizationId: tenantAId,
        type: 'OTHER',
        fileName: 'fictitious-reference.txt',
      },
    });
  });

  afterAll(async () => {
    await cleanFixtures();
    await prismaClient.$disconnect();
  });

  it('reads only the requested non-deleted organization projection', async () => {
    await expect(organizationAdapter.findById(tenantAId)).resolves.toMatchObject({
      id: tenantAId,
      type: 'OTEC',
      status: 'ACTIVE',
    });
    await expect(organizationAdapter.findById(randomUUID())).resolves.toBeNull();
  });

  it('validates document ownership without disclosing another tenant document', async () => {
    await expect(documentAdapter.belongsToTenant(tenantAId, documentAId)).resolves.toBe(true);
    await expect(documentAdapter.belongsToTenant(tenantBId, documentAId)).resolves.toBe(false);
    await expect(documentAdapter.belongsToTenant(tenantAId, randomUUID())).resolves.toBe(false);
  });
});

async function cleanFixtures(): Promise<void> {
  await prismaClient.document.deleteMany({
    where: { organizationId: { in: [tenantAId, tenantBId] } },
  });
  await prismaClient.organization.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
}
