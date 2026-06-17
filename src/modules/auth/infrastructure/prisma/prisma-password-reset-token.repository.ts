import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import type {
  PasswordResetTokenRecord,
  PasswordResetTokenRepository,
} from '../../domain/repositories/password-reset-token.repository.js';

interface PasswordResetTokenRow {
  id: string;
  user_id: string;
  organization_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
  ip_address: string | null;
  user_agent: string | null;
}

export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async invalidateActiveTokensForUser(userId: string, usedAt: Date): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE password_reset_tokens
      SET used_at = ${usedAt}
      WHERE user_id = ${userId}::uuid
        AND used_at IS NULL
        AND expires_at > ${usedAt}
    `;
  }

  async save(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<PasswordResetTokenRecord> {
    const [record] = await this.prisma.$queryRaw<PasswordResetTokenRow[]>`
      INSERT INTO password_reset_tokens (
        id,
        user_id,
        token_hash,
        expires_at,
        ip_address,
        user_agent
      )
      VALUES (
        ${randomUUID()}::uuid,
        ${input.userId}::uuid,
        ${input.tokenHash},
        ${input.expiresAt},
        ${input.ipAddress},
        ${input.userAgent}
      )
      RETURNING
        id::text,
        user_id::text,
        (
          SELECT organization_id::text
          FROM users
          WHERE users.id = password_reset_tokens.user_id
        ) AS organization_id,
        token_hash,
        expires_at,
        used_at,
        created_at,
        ip_address,
        user_agent
    `;
    if (!record) {
      throw new Error('Password reset token was not created');
    }
    return this.toRecord(record);
  }

  async findActiveByTokenHash(tokenHash: string, now: Date): Promise<PasswordResetTokenRecord | null> {
    const [record] = await this.prisma.$queryRaw<PasswordResetTokenRow[]>`
      SELECT
        password_reset_tokens.id::text,
        password_reset_tokens.user_id::text,
        users.organization_id::text,
        password_reset_tokens.token_hash,
        password_reset_tokens.expires_at,
        password_reset_tokens.used_at,
        password_reset_tokens.created_at,
        password_reset_tokens.ip_address,
        password_reset_tokens.user_agent
      FROM password_reset_tokens
      INNER JOIN users ON users.id = password_reset_tokens.user_id
      WHERE password_reset_tokens.token_hash = ${tokenHash}
        AND password_reset_tokens.used_at IS NULL
        AND password_reset_tokens.expires_at > ${now}
      LIMIT 1
    `;
    return record ? this.toRecord(record) : null;
  }

  async markUsed(id: string, usedAt: Date): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE password_reset_tokens
      SET used_at = ${usedAt}
      WHERE id = ${id}::uuid
    `;
  }

  private toRecord(record: PasswordResetTokenRow): PasswordResetTokenRecord {
    return {
      id: record.id,
      userId: record.user_id,
      organizationId: record.organization_id,
      tokenHash: record.token_hash,
      expiresAt: record.expires_at,
      usedAt: record.used_at,
      createdAt: record.created_at,
      ipAddress: record.ip_address,
      userAgent: record.user_agent,
    };
  }
}
