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
    const eligibleOrganization = await transaction.organization.updateMany({
      where: { id: input.organizationId, deletedAt: null },
      data: { type: 'OTEC' },
    });
    if (eligibleOrganization.count !== 1) {
      throw new Error('The OTEC Compliance organization was not found.');
    }
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
    await transaction.$executeRaw`
      INSERT INTO "tenant_module_entitlements" (
        "id",
        "organization_id",
        "module_code",
        "status",
        "enabled_features",
        "valid_from",
        "valid_until",
        "restriction_reason",
        "created_at",
        "updated_at",
        "version"
      )
      VALUES (
        gen_random_uuid(),
        ${input.organizationId}::uuid,
        'OTEC_COMPLIANCE'::"ModuleCode",
        'ENABLED'::"ModuleEntitlementStatus",
        '[]'::jsonb,
        NOW(),
        NULL,
        NULL,
        NOW(),
        NOW(),
        1
      )
      ON CONFLICT ("organization_id", "module_code") WHERE "deleted_at" IS NULL
      DO UPDATE SET
        "status" = 'ENABLED'::"ModuleEntitlementStatus",
        "valid_from" = COALESCE("tenant_module_entitlements"."valid_from", NOW()),
        "valid_until" = NULL,
        "restriction_reason" = NULL,
        "updated_at" = NOW(),
        "version" = "tenant_module_entitlements"."version" + 1
    `;
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
