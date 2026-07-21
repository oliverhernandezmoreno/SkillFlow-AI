import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import {
  otecCompliancePermissionCodes,
  seedOtecCompliancePermissions,
} from './seed-otec-compliance-permissions.js';

const organizationId = '35000000-0000-4000-8000-000000000001';
const roleId = '35000000-0000-4000-8000-000000000002';

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
});

async function clean(): Promise<void> {
  await prismaClient.rolePermission.deleteMany({ where: { organizationId } });
  await prismaClient.role.deleteMany({ where: { id: roleId } });
  await prismaClient.organization.deleteMany({ where: { id: organizationId } });
  await prismaClient.permission.deleteMany({
    where: { code: 'unrelated.existing' },
  });
}
