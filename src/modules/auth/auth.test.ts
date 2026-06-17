import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it } from 'vitest';

import type { PaginatedResult, PaginationInput } from '../../shared/application/pagination.js';
import { registerSchema } from './interfaces/http/validators/auth.validators.js';
import type { AuthIdentityRepository } from './domain/repositories/auth-identity.repository.js';
import type {
  PasswordResetTokenRecord,
  PasswordResetTokenRepository,
} from './domain/repositories/password-reset-token.repository.js';
import type { EmailService, PasswordResetEmailInput } from './domain/services/email-service.js';
import { RegisterOrganizationUseCase } from './application/use-cases/register-organization.use-case.js';
import type { OrganizationRepository } from '../organizations/domain/repositories/organization.repository.js';
import type { Organization } from '../organizations/domain/entities/organization.entity.js';
import type { UserRepository, UserSearchFilters } from '../users/domain/repositories/user.repository.js';
import { User } from '../users/domain/entities/user.entity.js';
import { NodePasswordHasher } from './infrastructure/services/node-password-hasher.js';
import { JwtTokenService } from './infrastructure/services/jwt-token.service.js';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case.js';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case.js';
import type { AuthenticatedLocals } from './interfaces/http/auth-context.js';
import { requireAuth } from './interfaces/http/middlewares/require-auth.middleware.js';
import { requirePermission } from './interfaces/http/middlewares/require-permission.middleware.js';
import type { AuditLogger, AuditLogInput } from '../../shared/application/audit-logger.js';

class FakeOrganizationRepository implements OrganizationRepository {
  organizations: Organization[] = [];

  async findById(id: string): Promise<Organization | null> {
    return this.organizations.find((organization) => organization.id === id) ?? null;
  }

  async findByTaxId(taxId: string): Promise<Organization | null> {
    return (
      this.organizations.find(
        (organization) => organization.toPrimitives().taxId === taxId,
      ) ?? null
    );
  }

  async search(): Promise<PaginatedResult<Organization>> {
    return { data: this.organizations, meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
  }

  async save(organization: Organization): Promise<void> {
    this.organizations.push(organization);
  }

  async update(organization: Organization): Promise<void> {
    this.organizations = this.organizations.map((current) =>
      current.id === organization.id ? organization : current,
    );
  }
}

class FakeUserRepository implements UserRepository {
  users: User[] = [];

  async findById(id: string, organizationId: string): Promise<User | null> {
    return (
      this.users.find((user) => {
        const props = user.toPrimitives();
        return user.id === id && props.organizationId === organizationId;
      }) ?? null
    );
  }

  async findByEmail(organizationId: string, email: string): Promise<User | null> {
    return (
      this.users.find((user) => {
        const props = user.toPrimitives();
        return props.organizationId === organizationId && props.email === email.toLowerCase();
      }) ?? null
    );
  }

  async search(
    _filters: UserSearchFilters,
    _pagination: PaginationInput,
  ): Promise<PaginatedResult<User>> {
    return { data: this.users, meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
  }

  async save(user: User): Promise<void> {
    this.users.push(user);
  }

  async update(user: User): Promise<void> {
    this.users = this.users.map((current) => (current.id === user.id ? user : current));
  }
}

class FakeAuthIdentityRepository implements AuthIdentityRepository {
  auditEvents: { email: string; success: boolean }[] = [];
  successfulLoginUserIds: string[] = [];

  constructor(private readonly user: User | null, private readonly permissions: string[] = []) {}

  async findUserByEmail(email: string): Promise<User | null> {
    if (!this.user) {
      return null;
    }

    return this.user.toPrimitives().email === email.toLowerCase() ? this.user : null;
  }

  async findPermissionCodesByUserId(_userId: string): Promise<string[]> {
    return this.permissions;
  }

  async recordSuccessfulLogin(userId: string, _organizationId: string): Promise<void> {
    this.successfulLoginUserIds.push(userId);
  }

  async recordLoginAuditEvent(input: {
    organizationId: string | null;
    actorUserId: string | null;
    email: string;
    success: boolean;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<void> {
    this.auditEvents.push({ email: input.email, success: input.success });
  }
}

class FakePasswordResetTokenRepository implements PasswordResetTokenRepository {
  records: PasswordResetTokenRecord[] = [];

  constructor(private readonly usersById: Map<string, User> = new Map()) {}

  async invalidateActiveTokensForUser(userId: string, usedAt: Date): Promise<void> {
    this.records = this.records.map((record) =>
      record.userId === userId && record.usedAt === null && record.expiresAt > usedAt
        ? { ...record, usedAt }
        : record,
    );
  }

  async save(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<PasswordResetTokenRecord> {
    const user = this.usersById.get(input.userId);
    const record: PasswordResetTokenRecord = {
      id: `reset-${String(this.records.length + 1)}`,
      userId: input.userId,
      organizationId: user?.toPrimitives().organizationId ?? '',
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      usedAt: null,
      createdAt: new Date(),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    };
    this.records.push(record);
    return record;
  }

  async findActiveByTokenHash(tokenHash: string, now: Date): Promise<PasswordResetTokenRecord | null> {
    return (
      this.records.find((record) => {
        return record.tokenHash === tokenHash && record.usedAt === null && record.expiresAt > now;
      }) ?? null
    );
  }

  async markUsed(id: string, usedAt: Date): Promise<void> {
    this.records = this.records.map((record) => (record.id === id ? { ...record, usedAt } : record));
  }
}

class FakeEmailService implements EmailService {
  passwordResetEmails: PasswordResetEmailInput[] = [];

  async sendPasswordReset(input: PasswordResetEmailInput): Promise<void> {
    this.passwordResetEmails.push(input);
  }
}

class FakeAuditLogger implements AuditLogger {
  records: AuditLogInput[] = [];

  async record(input: AuditLogInput): Promise<void> {
    this.records.push(input);
  }
}

const tokenService = new JwtTokenService({
  accessTokenSecret: 'test-access-token-secret',
  refreshTokenSecret: 'test-refresh-token-secret',
  accessTokenExpiresIn: '15m',
  refreshTokenExpiresIn: '7d',
});

describe('Auth module', () => {
  it('validates register input', () => {
    expect(() =>
      registerSchema.parse({
        organizationName: 'ACME Training',
        taxId: '76.123.456-7',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'password123',
      }),
    ).not.toThrow();
  });

  it('registers an organization and admin user', async () => {
    const result = await new RegisterOrganizationUseCase(
      new FakeOrganizationRepository(),
      new FakeUserRepository(),
      new NodePasswordHasher(),
      tokenService,
    ).execute({
      organizationName: 'ACME Training',
      taxId: '76.123.456-7',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'password123',
    });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.user.email).toBe('admin@example.com');
  });

  it('logs in with valid credentials', async () => {
    const passwordHasher = new NodePasswordHasher();
    const user = User.create({
      organizationId: '1b1f1c99-90a5-458d-a22a-84519a7ce6d0',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      passwordHash: await passwordHasher.hash('password123'),
      roleIds: ['f5576ad3-bc77-4538-9c1a-7af720dfbbaa'],
    });
    const authIdentityRepository = new FakeAuthIdentityRepository(user, ['users.read']);

    const result = await new LoginUseCase(
      authIdentityRepository,
      passwordHasher,
      tokenService,
    ).execute(
      { email: 'admin@example.com', password: 'password123' },
      { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
    );

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(authIdentityRepository.auditEvents).toContainEqual({
      email: 'admin@example.com',
      success: true,
    });
  });

  it('rejects invalid login credentials', async () => {
    const passwordHasher = new NodePasswordHasher();
    const user = User.create({
      organizationId: '1b1f1c99-90a5-458d-a22a-84519a7ce6d0',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      passwordHash: await passwordHasher.hash('password123'),
    });
    const authIdentityRepository = new FakeAuthIdentityRepository(user);

    await expect(
      new LoginUseCase(authIdentityRepository, passwordHasher, tokenService).execute(
        { email: 'admin@example.com', password: 'wrong-password' },
        { ipAddress: null, userAgent: null },
      ),
    ).rejects.toThrow('Invalid credentials');
    expect(authIdentityRepository.auditEvents).toContainEqual({
      email: 'admin@example.com',
      success: false,
    });
  });

  it('accepts forgot password for unknown email without sending email', async () => {
    const emailService = new FakeEmailService();
    const auditLogger = new FakeAuditLogger();

    await new ForgotPasswordUseCase(
      new FakeAuthIdentityRepository(null),
      new FakePasswordResetTokenRepository(),
      emailService,
      auditLogger,
    ).execute(
      { email: 'missing@example.com' },
      { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
    );

    expect(emailService.passwordResetEmails).toHaveLength(0);
    expect(auditLogger.records[0]?.action).toBe('PASSWORD_RESET_REQUESTED_UNKNOWN_EMAIL');
  });

  it('creates a one-time password reset token and invalidates older tokens', async () => {
    const passwordHasher = new NodePasswordHasher();
    const user = User.create({
      organizationId: '1b1f1c99-90a5-458d-a22a-84519a7ce6d0',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      passwordHash: await passwordHasher.hash('password123'),
    });
    const tokenRepository = new FakePasswordResetTokenRepository(new Map([[user.id, user]]));
    const emailService = new FakeEmailService();

    const useCase = new ForgotPasswordUseCase(
      new FakeAuthIdentityRepository(user),
      tokenRepository,
      emailService,
      new FakeAuditLogger(),
    );

    await useCase.execute(
      { email: 'admin@example.com' },
      { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
    );
    await useCase.execute(
      { email: 'admin@example.com' },
      { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
    );

    expect(emailService.passwordResetEmails).toHaveLength(2);
    expect(tokenRepository.records).toHaveLength(2);
    expect(tokenRepository.records[0]?.usedAt).toBeInstanceOf(Date);
    expect(tokenRepository.records[1]?.usedAt).toBeNull();
    expect(tokenRepository.records[1]?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('resets a password once with a valid token', async () => {
    const passwordHasher = new NodePasswordHasher();
    const userRepository = new FakeUserRepository();
    const user = User.create({
      organizationId: '1b1f1c99-90a5-458d-a22a-84519a7ce6d0',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      passwordHash: await passwordHasher.hash('password123'),
    });
    userRepository.users.push(user);
    const authIdentityRepository = new FakeAuthIdentityRepository(user);
    const tokenRepository = new FakePasswordResetTokenRepository(new Map([[user.id, user]]));
    const emailService = new FakeEmailService();

    await new ForgotPasswordUseCase(
      authIdentityRepository,
      tokenRepository,
      emailService,
      new FakeAuditLogger(),
    ).execute(
      { email: 'admin@example.com' },
      { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
    );

    const resetToken = emailService.passwordResetEmails[0]?.resetToken;
    expect(resetToken).toEqual(expect.any(String));

    await new ResetPasswordUseCase(
      tokenRepository,
      userRepository,
      passwordHasher,
      new FakeAuditLogger(),
    ).execute(
      { token: resetToken ?? '', password: 'new-password-123' },
      { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
    );

    const updatedUser = userRepository.users[0];
    expect(updatedUser).toBeDefined();
    expect(await passwordHasher.verify('new-password-123', updatedUser?.toPrimitives().passwordHash ?? '')).toBe(
      true,
    );
    await expect(
      new ResetPasswordUseCase(tokenRepository, userRepository, passwordHasher).execute(
        { token: resetToken ?? '', password: 'another-password-123' },
        { ipAddress: null, userAgent: null },
      ),
    ).rejects.toThrow('Invalid or expired password reset token');
  });

  it('rejects a protected endpoint without a token', async () => {
    const middleware = requireAuth(tokenService);
    const request = {
      header: () => undefined,
    } as unknown as Request;
    const response = { locals: {} } as Response;
    const next: NextFunction = () => {
      return undefined;
    };

    expect(() => {
      middleware(request, response, next);
    }).toThrow('Authentication required');
  });

  it('allows a protected endpoint with a token', async () => {
    const passwordHasher = new NodePasswordHasher();
    const user = User.create({
      organizationId: '1b1f1c99-90a5-458d-a22a-84519a7ce6d0',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      passwordHash: await passwordHasher.hash('password123'),
    });
    const tokenPair = tokenService.createTokenPair(user);
    const middleware = requireAuth(tokenService);
    const request = {
      header: (name: string) =>
        name === 'authorization' ? `Bearer ${tokenPair.accessToken}` : undefined,
    } as unknown as Request;
    const response = { locals: {} } as Response<unknown, AuthenticatedLocals>;
    let wasNextCalled = false;
    const next: NextFunction = () => {
      wasNextCalled = true;
    };

    middleware(request, response, next);

    expect(wasNextCalled).toBe(true);
    expect(response.locals.auth?.userId).toBe(user.id);
  });

  it('rejects insufficient permissions', () => {
    const middleware = requirePermission('users.read');
    const response = {
      locals: {
        auth: {
          userId: '22222222-2222-4222-8222-222222222222',
          organizationId: '1b1f1c99-90a5-458d-a22a-84519a7ce6d0',
          roleIds: [],
          permissions: ['courses.read'],
          type: 'access',
        },
      },
    } as unknown as Response<unknown, AuthenticatedLocals>;
    const next: NextFunction = () => {
      return undefined;
    };

    expect(() => {
      middleware({} as Request, response, next);
    }).toThrow('Permission denied');
  });

  it('refreshes a valid refresh token', async () => {
    const passwordHasher = new NodePasswordHasher();
    const user = User.create({
      organizationId: '1b1f1c99-90a5-458d-a22a-84519a7ce6d0',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      passwordHash: await passwordHasher.hash('password123'),
    });
    const tokenPair = tokenService.createTokenPair(user, ['users.read']);

    const refreshed = new RefreshTokenUseCase(tokenService).execute(tokenPair.refreshToken);

    expect(refreshed.accessToken).toEqual(expect.any(String));
    expect(refreshed.refreshToken).toEqual(expect.any(String));
  });
});
