import type { PrismaClient, User as PrismaUser } from '@prisma/client';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { User } from '../../../users/domain/entities/user.entity.js';
import type { AuthIdentityRepository } from '../../domain/repositories/auth-identity.repository.js';

type PrismaUserWithRoles = PrismaUser & { userRoles?: { roleId: string }[] };

export class PrismaAuthIdentityRepository implements AuthIdentityRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findUserByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findFirst({
      where: { normalizedEmail: email.toLowerCase(), deletedAt: null },
      include: { userRoles: true },
    });

    return record ? this.toDomain(record) : null;
  }

  async findPermissionCodesByUserId(
    userId: string,
    organizationId: string,
  ): Promise<string[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        organizationId,
        deletedAt: null,
        role: {
          organizationId,
          deletedAt: null,
          userRoles: {
            some: {
              userId,
              organizationId,
              deletedAt: null,
            },
          },
        },
        permission: {
          deletedAt: null,
        },
      },
      select: {
        permission: {
          select: {
            code: true,
          },
        },
      },
    });

    return [...new Set(rolePermissions.map((rolePermission) => rolePermission.permission.code))];
  }

  async recordSuccessfulLogin(userId: string, organizationId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id_organizationId: { id: userId, organizationId } },
      data: { lastLoginAt: new Date() },
    });
  }

  async recordLoginAuditEvent(input: {
    organizationId: string | null;
    actorUserId: string | null;
    email: string;
    success: boolean;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        entityType: 'Auth',
        entityId: input.actorUserId,
        action: input.success ? 'AUTH_LOGIN_SUCCEEDED' : 'AUTH_LOGIN_FAILED',
        metadata: {
          email: input.email.toLowerCase(),
          success: input.success,
        },
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  private toDomain(record: PrismaUserWithRoles): User {
    return User.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone,
      passwordHash: record.passwordHash,
      roleIds: record.userRoles?.map((userRole) => userRole.roleId) ?? [],
      status: record.status,
      lastLoginAt: record.lastLoginAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }
}
