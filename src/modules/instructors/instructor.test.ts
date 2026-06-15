import { describe, expect, it } from 'vitest';

import { ConflictError, NotFoundError } from '../../shared/domain/errors.js';
import { CreateInstructorUseCase } from './application/use-cases/create-instructor.use-case.js';
import { GetInstructorUseCase } from './application/use-cases/get-instructor.use-case.js';
import type { Instructor } from './domain/entities/instructor.entity.js';
import type { InstructorRepository } from './domain/repositories/instructor.repository.js';
import { createInstructorSchema } from './interfaces/http/validators/instructor.validators.js';

class FakeInstructorRepository implements InstructorRepository {
  instructors: Instructor[] = [];

  async findById(id: string, organizationId: string): Promise<Instructor | null> {
    return (
      this.instructors.find((instructor) => {
        const props = instructor.toPrimitives();
        return instructor.id === id && props.organizationId === organizationId;
      }) ?? null
    );
  }

  async findByEmail(organizationId: string, normalizedEmail: string): Promise<Instructor | null> {
    return (
      this.instructors.find((instructor) => {
        const props = instructor.toPrimitives();
        return props.organizationId === organizationId && props.normalizedEmail === normalizedEmail;
      }) ?? null
    );
  }

  async search() {
    return { data: this.instructors, meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
  }

  async save(instructor: Instructor): Promise<void> {
    this.instructors.push(instructor);
  }

  async update(instructor: Instructor): Promise<void> {
    const props = instructor.toPrimitives();
    this.instructors = this.instructors.map((current) => {
      const currentProps = current.toPrimitives();
      return current.id === instructor.id && currentProps.organizationId === props.organizationId
        ? instructor
        : current;
    });
  }
}

const organizationId = '11111111-1111-4111-8111-111111111111';

describe('Instructors module', () => {
  it('validates create instructor input', () => {
    const result = createInstructorSchema.parse({
      organizationId,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'Ada.Lovelace@example.com',
      specialties: ['safety'],
    });

    expect(result.email).toBe('Ada.Lovelace@example.com');
  });

  it('creates an active instructor and normalizes email for uniqueness', async () => {
    const repository = new FakeInstructorRepository();
    const result = await new CreateInstructorUseCase(repository).execute({
      organizationId,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'Ada.Lovelace@example.com',
    });

    expect(result.status).toBe('ACTIVE');
    expect(result.normalizedEmail).toBe('ada.lovelace@example.com');
  });

  it('prevents duplicate instructor email inside the same organization', async () => {
    const repository = new FakeInstructorRepository();
    const useCase = new CreateInstructorUseCase(repository);

    await useCase.execute({
      organizationId,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    });

    await expect(
      useCase.execute({
        organizationId,
        firstName: 'Augusta',
        lastName: 'King',
        email: 'ADA@example.com',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('does not read instructors across tenants', async () => {
    const repository = new FakeInstructorRepository();
    const created = await new CreateInstructorUseCase(repository).execute({
      organizationId,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    });

    await expect(
      new GetInstructorUseCase(repository).execute(created.id, {
        organizationId: '22222222-2222-4222-8222-222222222222',
        actorUserId: null,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
