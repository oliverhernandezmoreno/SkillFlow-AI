import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it } from 'vitest';

import type { PaginatedResult, PaginationInput } from '../../shared/application/pagination.js';
import { registerSchema } from './interfaces/http/validators/auth.validators.js';
import type { AuthIdentityRepository } from './domain/repositories/auth-identity.repository.js';
import { RegisterOrganizationUseCase } from './application/use-cases/register-organization.use-case.js';
import type { OrganizationRepository } from '../organizations/domain/repositories/organization.repository.js';
import type { Organization } from '../organizations/domain/entities/organization.entity.js';
import type { UserRepository, UserSearchFilters } from '../users/domain/repositories/user.repository.js';
import { User } from '../users/domain/entities/user.entity.js';
import { NodePasswordHasher } from './infrastructure/services/node-password-hasher.js';
import { JwtTokenService } from './infrastructure/services/jwt-token.service.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import type { AuthenticatedLocals } from './interfaces/http/auth-context.js';
import { requireAuth } from './interfaces/http/middlewares/require-auth.middleware.js';

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

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
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

  async recordSuccessfulLogin(userId: string): Promise<void> {
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
    const authIdentityRepository = new FakeAuthIdentityRepository(user, ['users:read']);

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
});
