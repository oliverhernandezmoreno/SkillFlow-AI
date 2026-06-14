import { describe, expect, it } from 'vitest';

import { ForbiddenError, NotFoundError } from '../../shared/domain/errors.js';
import { createCourseSchema } from './interfaces/http/validators/course.validators.js';
import { CreateCourseUseCase } from './application/use-cases/create-course.use-case.js';
import { GetCourseUseCase } from './application/use-cases/get-course.use-case.js';
import type { CourseRepository } from './domain/repositories/course.repository.js';
import type { Course } from './domain/entities/course.entity.js';

class FakeCourseRepository implements CourseRepository {
  courses: Course[] = [];

  async findById(id: string, organizationId: string): Promise<Course | null> {
    return (
      this.courses.find((course) => {
        const props = course.toPrimitives();
        return course.id === id && props.organizationId === organizationId;
      }) ?? null
    );
  }

  async findByCode(organizationId: string, code: string): Promise<Course | null> {
    return (
      this.courses.find((course) => {
        const props = course.toPrimitives();
        return props.organizationId === organizationId && props.code === code;
      }) ?? null
    );
  }

  async search() {
    return { data: this.courses, meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
  }

  async save(course: Course): Promise<void> {
    this.courses.push(course);
  }

  async update(course: Course): Promise<void> {
    const props = course.toPrimitives();
    this.courses = this.courses.map((current) => {
      const currentProps = current.toPrimitives();
      return current.id === course.id && currentProps.organizationId === props.organizationId
        ? course
        : current;
    });
  }
}

describe('Courses module', () => {
  it('normalizes API modality aliases', () => {
    const result = createCourseSchema.parse({
      organizationId: '11111111-1111-4111-8111-111111111111',
      code: 'SEG-001',
      name: 'Safety induction',
      modality: 'BLENDED',
      durationHours: 8,
    });

    expect(result.modality).toBe('HYBRID');
  });

  it('creates a course', async () => {
    const result = await new CreateCourseUseCase(new FakeCourseRepository()).execute({
      organizationId: '11111111-1111-4111-8111-111111111111',
      code: 'SEG-001',
      name: 'Safety induction',
      modality: 'PRESENTIAL',
      durationHours: 8,
    });

    expect(result.status).toBe('DRAFT');
  });

  it('rejects cross-tenant course creation', async () => {
    await expect(
      new CreateCourseUseCase(new FakeCourseRepository()).execute(
        {
          organizationId: '11111111-1111-4111-8111-111111111111',
          code: 'SEG-001',
          name: 'Safety induction',
          modality: 'PRESENTIAL',
          durationHours: 8,
        },
        { organizationId: '22222222-2222-4222-8222-222222222222', actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('does not read courses across tenants', async () => {
    const repository = new FakeCourseRepository();
    const created = await new CreateCourseUseCase(repository).execute({
      organizationId: '11111111-1111-4111-8111-111111111111',
      code: 'SEG-001',
      name: 'Safety induction',
      modality: 'PRESENTIAL',
      durationHours: 8,
    });

    await expect(
      new GetCourseUseCase(repository).execute(created.id, {
        organizationId: '22222222-2222-4222-8222-222222222222',
        actorUserId: null,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
