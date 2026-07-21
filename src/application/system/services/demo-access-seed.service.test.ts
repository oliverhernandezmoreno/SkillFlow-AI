import type { PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { seedOtecCompliancePermissions } from '../../../modules/otec-compliance/infrastructure/prisma/seed-otec-compliance-permissions.js';
import { seedDemoAccess } from './demo-access-seed.service.js';

vi.mock(
  '../../../modules/otec-compliance/infrastructure/prisma/seed-otec-compliance-permissions.js',
  () => ({ seedOtecCompliancePermissions: vi.fn() }),
);

describe('Demo access seed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('upserts access only for the existing Demo Admin role', async () => {
    const prisma = createPrismaMock();
    vi.mocked(seedOtecCompliancePermissions).mockResolvedValue(8);

    await expect(seedDemoAccess(prisma.client)).resolves.toMatchObject({
      organizationId: 'organization-id',
      adminUserId: 'admin-user-id',
      adminRoleId: 'admin-role-id',
      otecCompliancePermissionCount: 8,
      otecComplianceEntitlementEnabled: true,
    });

    expect(prisma.roleFindUnique).toHaveBeenCalledWith({
      where: {
        organizationId_code: {
          organizationId: 'organization-id',
          code: 'demo-admin',
        },
      },
      select: { id: true },
    });
    expect(prisma.userRoleUpsert).toHaveBeenCalledOnce();
    expect(seedOtecCompliancePermissions).toHaveBeenCalledWith(prisma.client, {
      organizationId: 'organization-id',
      roleId: 'admin-role-id',
    });
  });

  it('fails without writing when the demo organization does not exist', async () => {
    const prisma = createPrismaMock();
    prisma.organizationFindUnique.mockResolvedValue(null);

    await expect(seedDemoAccess(prisma.client)).rejects.toThrow('was not found');

    expect(prisma.userRoleUpsert).not.toHaveBeenCalled();
    expect(seedOtecCompliancePermissions).not.toHaveBeenCalled();
  });
});

function createPrismaMock() {
  const organizationFindUnique = vi.fn().mockResolvedValue({ id: 'organization-id' });
  const userFindUnique = vi.fn().mockResolvedValue({ id: 'admin-user-id' });
  const roleFindUnique = vi.fn().mockResolvedValue({ id: 'admin-role-id' });
  const userRoleUpsert = vi.fn().mockResolvedValue({ id: 'user-role-id' });
  const client = {
    organization: { findUnique: organizationFindUnique },
    user: { findUnique: userFindUnique },
    role: { findUnique: roleFindUnique },
    userRole: { upsert: userRoleUpsert },
  } as unknown as PrismaClient;

  return {
    client,
    organizationFindUnique,
    roleFindUnique,
    userRoleUpsert,
  };
}
