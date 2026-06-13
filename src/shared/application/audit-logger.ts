export interface AuditLogInput {
  organizationId: string | null;
  actorUserId: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  metadata: Record<string, unknown>;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditLogger {
  record(input: AuditLogInput): Promise<void>;
}

export class NoopAuditLogger implements AuditLogger {
  async record(_input: AuditLogInput): Promise<void> {
    return undefined;
  }
}
