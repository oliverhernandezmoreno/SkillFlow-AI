import type { User } from '../../../users/domain/entities/user.entity.js';

export interface AuthIdentityRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findPermissionCodesByUserId(userId: string): Promise<string[]>;
  recordSuccessfulLogin(userId: string, organizationId: string): Promise<void>;
  recordLoginAuditEvent(input: {
    organizationId: string | null;
    actorUserId: string | null;
    email: string;
    success: boolean;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<void>;
}
