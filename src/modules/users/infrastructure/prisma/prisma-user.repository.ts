import type { Prisma, PrismaClient, User as PrismaUser } from '@prisma/client';

import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { User } from '../../domain/entities/user.entity.js';
import type { UserRepository, UserSearchFilters } from '../../domain/repositories/user.repository.js';

type PrismaUserWithRoles = PrismaUser & { userRoles?: { roleId: string }[] };

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { userRoles: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(organizationId: string, email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: {
        organizationId_normalizedEmail: {
          organizationId,
          normalizedEmail: email.toLowerCase(),
        },
      },
      include: { userRoles: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async search(
    filters: UserSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<User>> {
    const where: Prisma.UserWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.search
        ? {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [records, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { userRoles: true },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: records.map((record) => this.toDomain(record)),
      meta: createPaginationMeta(pagination, total),
    };
  }

  async save(user: User): Promise<void> {
    const props = user.toPrimitives();
    await this.prisma.user.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        firstName: props.firstName,
        lastName: props.lastName,
        email: props.email,
        normalizedEmail: props.email.toLowerCase(),
        phone: props.phone,
        passwordHash: props.passwordHash,
        status: props.status,
        lastLoginAt: props.lastLoginAt,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
        userRoles: {
          create: props.roleIds.map((roleId) => ({
            organizationId: props.organizationId,
            roleId,
          })),
        },
      },
    });
  }

  async update(user: User): Promise<void> {
    const props = user.toPrimitives();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: props.id },
        data: {
          firstName: props.firstName,
          lastName: props.lastName,
          phone: props.phone,
          passwordHash: props.passwordHash,
          status: props.status,
          deletedAt: props.deletedAt,
          updatedAt: props.updatedAt,
          version: props.version,
        },
      }),
      this.prisma.userRole.deleteMany({
        where: { userId: props.id, organizationId: props.organizationId },
      }),
      this.prisma.userRole.createMany({
        data: props.roleIds.map((roleId) => ({
          organizationId: props.organizationId,
          userId: props.id,
          roleId,
        })),
        skipDuplicates: true,
      }),
    ]);
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
