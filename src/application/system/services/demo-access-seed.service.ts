import type { PrismaClient } from '@prisma/client';

import { prismaClient } from '../../../infrastructure/prisma/prisma-client.js';
import { seedOtecCompliancePermissions } from '../../../modules/otec-compliance/infrastructure/prisma/seed-otec-compliance-permissions.js';

const demoOrganizationTaxId = '76.555.444-0';
const demoAdminNormalizedEmail = 'admin@skillflow.demo';
const demoAdminRoleCode = 'demo-admin';

export interface DemoAccessSeedSummary {
  organizationId: string;
  adminUserId: string;
  adminRoleId: string;
  otecCompliancePermissionCount: number;
  otecComplianceEntitlementEnabled: true;
}

export async function seedDemoAccess(
  prisma: PrismaClient = prismaClient,
): Promise<DemoAccessSeedSummary> {
  const organization = await prisma.organization.findUnique({
    where: { taxId: demoOrganizationTaxId },
    select: { id: true },
  });
  if (!organization) {
    throw new Error(`Demo organization with tax ID ${demoOrganizationTaxId} was not found.`);
  }

  const [adminUser, adminRole] = await Promise.all([
    prisma.user.findUnique({
      where: {
        organizationId_normalizedEmail: {
          organizationId: organization.id,
          normalizedEmail: demoAdminNormalizedEmail,
        },
      },
      select: { id: true },
    }),
    prisma.role.findUnique({
      where: {
        organizationId_code: {
          organizationId: organization.id,
          code: demoAdminRoleCode,
        },
      },
      select: { id: true },
    }),
  ]);
  if (!adminUser) throw new Error('Demo Admin user was not found.');
  if (!adminRole) throw new Error('Demo Admin role was not found.');

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: { organizationId: organization.id, deletedAt: null },
    create: {
      organizationId: organization.id,
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });
  const otecCompliancePermissionCount = await seedOtecCompliancePermissions(prisma, {
    organizationId: organization.id,
    roleId: adminRole.id,
  });

  return {
    organizationId: organization.id,
    adminUserId: adminUser.id,
    adminRoleId: adminRole.id,
    otecCompliancePermissionCount,
    otecComplianceEntitlementEnabled: true,
  };
}
