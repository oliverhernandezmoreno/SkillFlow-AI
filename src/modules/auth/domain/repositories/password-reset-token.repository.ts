export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
  organizationId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface PasswordResetTokenRepository {
  invalidateActiveTokensForUser(userId: string, usedAt: Date): Promise<void>;
  save(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<PasswordResetTokenRecord>;
  findActiveByTokenHash(tokenHash: string, now: Date): Promise<PasswordResetTokenRecord | null>;
  markUsed(id: string, usedAt: Date): Promise<void>;
}
