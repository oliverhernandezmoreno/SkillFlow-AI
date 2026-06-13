import { Prisma, type PrismaClient } from '@prisma/client';

import type { AuditLogger, AuditLogInput } from '../../application/audit-logger.js';
import { prismaClient } from '../../../infrastructure/prisma/prisma-client.js';

export class PrismaAuditLogger implements AuditLogger {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async record(input: AuditLogInput): Promise<void> {
    const data: Prisma.AuditEventUncheckedCreateInput = {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      metadata: input.metadata as Prisma.InputJsonValue,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    };
    if (input.before !== undefined) {
      data.before = input.before === null ? Prisma.JsonNull : (input.before as Prisma.InputJsonValue);
    }
    if (input.after !== undefined) {
      data.after = input.after === null ? Prisma.JsonNull : (input.after as Prisma.InputJsonValue);
    }

    await this.prisma.auditEvent.create({
      data,
    });
  }
}
