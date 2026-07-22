import type { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { PrismaAuthIdentityRepository } from './prisma-auth-identity.repository.js';

describe('PrismaAuthIdentityRepository', () => {
  it('queries unique active permission codes within the requested organization', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { permission: { code: 'otec_compliance.read' } },
      { permission: { code: 'otec_compliance.profile.manage' } },
      { permission: { code: 'otec_compliance.profile.manage' } },
    ]);
    const prisma = {
      rolePermission: { findMany },
    } as unknown as PrismaClient;
    const repository = new PrismaAuthIdentityRepository(prisma);
    const result = await repository.findPermissionCodesByUserId(
      'b99db2ac-4b3e-46dd-8067-ea436c2fa315',
      '5be7caa5-91f8-4a4a-923b-70c8891ba9d0',
    );

    expect(findMany).toHaveBeenCalledWith({
      where: {
        organizationId: '5be7caa5-91f8-4a4a-923b-70c8891ba9d0',
        deletedAt: null,
        role: {
          organizationId: '5be7caa5-91f8-4a4a-923b-70c8891ba9d0',
          deletedAt: null,
          userRoles: {
            some: {
              userId: 'b99db2ac-4b3e-46dd-8067-ea436c2fa315',
              organizationId: '5be7caa5-91f8-4a4a-923b-70c8891ba9d0',
              deletedAt: null,
            },
          },
        },
        permission: { deletedAt: null },
      },
      select: { permission: { select: { code: true } } },
    });
    expect(result).toEqual([
      'otec_compliance.read',
      'otec_compliance.profile.manage',
    ]);
  });
});
