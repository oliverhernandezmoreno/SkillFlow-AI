import { describe, expect, it } from 'vitest';

import { createUserSchema } from './interfaces/http/validators/user.validators.js';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case.js';
import type { UserRepository } from './domain/repositories/user.repository.js';
import type { User } from './domain/entities/user.entity.js';
import type { PasswordHasher } from '../auth/domain/services/password-hasher.js';

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

  async search() {
    return { data: this.users, meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
  }

  async save(user: User): Promise<void> {
    this.users.push(user);
  }

  async update(user: User): Promise<void> {
    const props = user.toPrimitives();
    this.users = this.users.map((current) => {
      const currentProps = current.toPrimitives();
      return current.id === user.id && currentProps.organizationId === props.organizationId
        ? user
        : current;
    });
  }
}

class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    return passwordHash === `hashed:${password}`;
  }
}

describe('Users module', () => {
  it('validates create user input', () => {
    expect(() =>
      createUserSchema.parse({
        organizationId: '11111111-1111-4111-8111-111111111111',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roleIds: [],
      }),
    ).not.toThrow();
  });

  it('creates a user without exposing passwordHash', async () => {
    const useCase = new CreateUserUseCase(new FakeUserRepository(), new FakePasswordHasher());

    const result = await useCase.execute({
      organizationId: '11111111-1111-4111-8111-111111111111',
      email: 'Admin@Example.com',
      firstName: 'Admin',
      lastName: 'User',
      roleIds: [],
    });

    expect(result.email).toBe('admin@example.com');
    expect(Object.hasOwn(result, 'passwordHash')).toBe(false);
  });
});
