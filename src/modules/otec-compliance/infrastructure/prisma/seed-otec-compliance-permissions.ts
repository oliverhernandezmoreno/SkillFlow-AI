import type { PrismaClient } from '@prisma/client';

export const otecCompliancePermissionCodes = [
  'otec_compliance.read',
  'otec_compliance.profile.manage',
  'otec_compliance.accreditation.manage',
  'otec_compliance.certification.manage',
  'otec_compliance.office.manage',
  'otec_compliance.representative.manage',
  'otec_compliance.resolution.manage',
  'otec_compliance.readiness.evaluate',
] as const;

export async function seedOtecCompliancePermissions(
  prisma: PrismaClient,
  input: { organizationId: string; roleId: string },
): Promise<number> {
  return prisma.$transaction(async (transaction) => {
    const permissions = await Promise.all(
      otecCompliancePermissionCodes.map((code) =>
        transaction.permission.upsert({
          where: { code },
          update: { name: permissionName(code), description: `Allows ${code}.` },
          create: { code, name: permissionName(code), description: `Allows ${code}.` },
        }),
      ),
    );
    await Promise.all(
      permissions.map((permission) =>
        transaction.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: input.roleId, permissionId: permission.id } },
          update: { organizationId: input.organizationId },
          create: {
            organizationId: input.organizationId,
            roleId: input.roleId,
            permissionId: permission.id,
          },
        }),
      ),
    );
    return permissions.length;
  });
}

function permissionName(code: string): string {
  return code
    .split('.')
    .map((part) => part.replaceAll('_', ' '))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' · ');
}
