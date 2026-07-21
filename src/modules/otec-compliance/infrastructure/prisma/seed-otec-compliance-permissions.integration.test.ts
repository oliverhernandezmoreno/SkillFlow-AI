import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import {
  otecCompliancePermissionCodes,
  seedOtecCompliancePermissions,
} from './seed-otec-compliance-permissions.js';

const organizationId = '35000000-0000-4000-8000-000000000001';
const roleId = '35000000-0000-4000-8000-000000000002';
const unrelatedRoleId = '35000000-0000-4000-8000-000000000003';

describe('OTEC Compliance permission seed integration', () => {
  beforeAll(async () => {
    await clean();
    await prismaClient.organization.create({
      data: {
        id: organizationId,
        legalName: 'Fictitious Permission Seed OTEC',
        taxId: '76.123.450-1',
        email: 'otec-permission-seed@example.test',
        type: 'OTEC',
      },
    });
    await prismaClient.role.create({
      data: {
        id: roleId,
        organizationId,
        code: 'otec-seed-admin',
        name: 'Existing OTEC Administrator',
        isSystem: true,
      },
    });
    await prismaClient.role.create({
      data: {
        id: unrelatedRoleId,
        organizationId,
        code: 'unrelated-role',
        name: 'Unrelated role',
      },
    });
  });

  afterAll(async () => {
    await clean();
    await prismaClient.$disconnect();
  });

  it('is idempotent, assigns all permissions, and preserves an existing permission', async () => {
    await prismaClient.permission.upsert({
      where: { code: 'unrelated.existing' },
      update: {},
      create: { code: 'unrelated.existing', name: 'Unrelated existing permission' },
    });
    await expect(
      seedOtecCompliancePermissions(prismaClient, { organizationId, roleId }),
    ).resolves.toBe(8);
    await expect(
      seedOtecCompliancePermissions(prismaClient, { organizationId, roleId }),
    ).resolves.toBe(8);

    await expect(
      prismaClient.permission.count({
        where: { code: { in: [...otecCompliancePermissionCodes] } },
      }),
    ).resolves.toBe(8);
    await expect(
      prismaClient.rolePermission.count({ where: { organizationId, roleId } }),
    ).resolves.toBe(8);
    await expect(
      prismaClient.permission.count({ where: { code: 'unrelated.existing' } }),
    ).resolves.toBe(1);
  });

  it('enables the entitlement idempotently without modifying other roles', async () => {
    await prismaClient.tenantModuleEntitlement.deleteMany({ where: { organizationId } });
    await prismaClient.tenantModuleEntitlement.create({
      data: {
        organizationId,
        moduleCode: 'OTEC_COMPLIANCE',
        status: 'DISABLED',
        restrictionReason: 'Previous restriction',
      },
    });

    await seedOtecCompliancePermissions(prismaClient, { organizationId, roleId });
    await seedOtecCompliancePermissions(prismaClient, { organizationId, roleId });

    await expect(
      prismaClient.tenantModuleEntitlement.findMany({
        where: { organizationId, moduleCode: 'OTEC_COMPLIANCE', deletedAt: null },
      }),
    ).resolves.toMatchObject([
      {
        status: 'ENABLED',
        restrictionReason: null,
        validUntil: null,
      },
    ]);
    await expect(
      prismaClient.rolePermission.count({ where: { roleId: unrelatedRoleId } }),
    ).resolves.toBe(0);
  });
});

async function clean(): Promise<void> {
  await prismaClient.tenantModuleEntitlement.deleteMany({ where: { organizationId } });
  await prismaClient.rolePermission.deleteMany({ where: { organizationId } });
  await prismaClient.role.deleteMany({ where: { id: { in: [roleId, unrelatedRoleId] } } });
  await prismaClient.organization.deleteMany({ where: { id: organizationId } });
  await prismaClient.permission.deleteMany({
    where: { code: 'unrelated.existing' },
  });
}
