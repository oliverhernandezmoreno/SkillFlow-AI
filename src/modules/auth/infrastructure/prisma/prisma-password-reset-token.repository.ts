import type { PasswordResetToken as PrismaPasswordResetToken, PrismaClient } from '@prisma/client';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import type {
  PasswordResetTokenRecord,
  PasswordResetTokenRepository,
} from '../../domain/repositories/password-reset-token.repository.js';

type PrismaPasswordResetTokenWithUser = PrismaPasswordResetToken & {
  user: { organizationId: string };
}

export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async invalidateActiveTokensForUser(userId: string, usedAt: Date): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId,
        usedAt: null,
        expiresAt: { gt: usedAt },
      },
      data: { usedAt },
    });
  }

  async save(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<PasswordResetTokenRecord> {
    const record = await this.prisma.passwordResetToken.create({
      data: input,
      include: { user: { select: { organizationId: true } } },
    });
    return this.toRecord(record);
  }

  async findActiveByTokenHash(tokenHash: string, now: Date): Promise<PasswordResetTokenRecord | null> {
    const record = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: now },
      },
      include: { user: { select: { organizationId: true } } },
    });
    return record ? this.toRecord(record) : null;
  }

  async markUsed(id: string, usedAt: Date): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt },
    });
  }

  private toRecord(record: PrismaPasswordResetTokenWithUser): PasswordResetTokenRecord {
    return {
      id: record.id,
      userId: record.userId,
      organizationId: record.user.organizationId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      usedAt: record.usedAt,
      createdAt: record.createdAt,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
    };
  }
}
