import { describe, expect, it } from 'vitest';

import { NoopAuditLogger } from '../../shared/application/audit-logger.js';
import type { PaginatedResult, PaginationInput } from '../../shared/application/pagination.js';
import { BadRequestError, ConflictError, ForbiddenError } from '../../shared/domain/errors.js';
import type { Course } from '../courses/domain/entities/course.entity.js';
import type { CourseRepository } from '../courses/domain/repositories/course.repository.js';
import type { Employee } from '../employees/domain/entities/employee.entity.js';
import type { EmployeeRepository } from '../employees/domain/repositories/employee.repository.js';
import { TrainingSession } from '../training-sessions/domain/entities/training-session.entity.js';
import type { TrainingSessionRepository } from '../training-sessions/domain/repositories/training-session.repository.js';
import { CancelEnrollmentUseCase } from './application/use-cases/cancel-enrollment.use-case.js';
import { CreateEnrollmentUseCase } from './application/use-cases/create-enrollment.use-case.js';
import { ListEmployeeEnrollmentsUseCase } from './application/use-cases/list-employee-enrollments.use-case.js';
import { ListSessionEnrollmentsUseCase } from './application/use-cases/list-session-enrollments.use-case.js';
import { Enrollment } from './domain/entities/enrollment.entity.js';
import type {
  CreateEnrollmentCapacityInput,
  EnrollmentRepository,
  EnrollmentSearchFilters,
} from './domain/repositories/enrollment.repository.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const otherOrganizationId = '22222222-2222-4222-8222-222222222222';
const employeeId = '33333333-3333-4333-8333-333333333333';
const courseId = '44444444-4444-4444-8444-444444444444';
const trainingSessionId = '55555555-5555-4555-8555-555555555555';

class FakeEnrollmentRepository implements EnrollmentRepository {
  enrollments: Enrollment[] = [];

  async findById(id: string, inputOrganizationId: string): Promise<Enrollment | null> {
    return (
      this.enrollments.find((enrollment) => {
        const props = enrollment.toPrimitives();
        return enrollment.id === id && props.organizationId === inputOrganizationId;
      }) ?? null
    );
  }

  async findBySessionAndEmployee(
    inputOrganizationId: string,
    inputTrainingSessionId: string,
    inputEmployeeId: string,
  ): Promise<Enrollment | null> {
    return (
      this.enrollments.find((enrollment) => {
        const props = enrollment.toPrimitives();
        return (
          props.organizationId === inputOrganizationId &&
          props.trainingSessionId === inputTrainingSessionId &&
          props.employeeId === inputEmployeeId
        );
      }) ?? null
    );
  }

  async search(
    filters: EnrollmentSearchFilters,
    _pagination: PaginationInput,
  ): Promise<PaginatedResult<Enrollment>> {
    const data = this.enrollments.filter((enrollment) => {
      const props = enrollment.toPrimitives();
      return (
        props.organizationId === filters.organizationId &&
        (filters.trainingSessionId === undefined ||
          props.trainingSessionId === filters.trainingSessionId) &&
        (filters.employeeId === undefined || props.employeeId === filters.employeeId)
      );
    });
    return { data, meta: { page: 1, pageSize: 20, total: data.length, totalPages: 1 } };
  }

  async createWithCapacity(input: CreateEnrollmentCapacityInput): Promise<Enrollment> {
    const occupiedSeats = await this.countOccupiedSeats(
      input.organizationId,
      input.trainingSessionId,
      input.occupiedStatuses,
    );
    const status = occupiedSeats < input.capacity ? 'CONFIRMED' : 'WAITLISTED';
    const enrollment = Enrollment.create({ ...input, status });
    this.enrollments.push(enrollment);
    return enrollment;
  }

  async countOccupiedSeats(
    inputOrganizationId: string,
    inputTrainingSessionId: string,
    occupiedStatuses: string[],
  ): Promise<number> {
    return this.enrollments.filter((enrollment) => {
      const props = enrollment.toPrimitives();
      return (
        props.organizationId === inputOrganizationId &&
        props.trainingSessionId === inputTrainingSessionId &&
        occupiedStatuses.includes(props.status)
      );
    }).length;
  }

  async findOldestWaitlisted(
    inputOrganizationId: string,
    inputTrainingSessionId: string,
  ): Promise<Enrollment | null> {
    return (
      this.enrollments
        .filter((enrollment) => {
          const props = enrollment.toPrimitives();
          return (
            props.organizationId === inputOrganizationId &&
            props.trainingSessionId === inputTrainingSessionId &&
            props.status === 'WAITLISTED'
          );
        })
        .sort(
          (first, second) =>
            first.toPrimitives().enrolledAt.getTime() - second.toPrimitives().enrolledAt.getTime(),
        )[0] ?? null
    );
  }

  async save(enrollment: Enrollment): Promise<void> {
    this.enrollments.push(enrollment);
  }

  async update(enrollment: Enrollment): Promise<void> {
    const props = enrollment.toPrimitives();
    this.enrollments = this.enrollments.map((current) => {
      const currentProps = current.toPrimitives();
      return current.id === enrollment.id && currentProps.organizationId === props.organizationId
        ? enrollment
        : current;
    });
  }
}

class FakeEmployeeRepository implements EmployeeRepository {
  constructor(private readonly employees: Employee[]) {}

  async findById(id: string, inputOrganizationId: string): Promise<Employee | null> {
    return (
      this.employees.find((employee) => {
        const props = employee.toPrimitives();
        return employee.id === id && props.organizationId === inputOrganizationId;
      }) ?? null
    );
  }

  async findByRut(): Promise<Employee | null> {
    return null;
  }

  async search(): Promise<PaginatedResult<Employee>> {
    return { data: this.employees, meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
  }

  async save(): Promise<void> {
    return undefined;
  }

  async update(): Promise<void> {
    return undefined;
  }
}

class FakeTrainingSessionRepository implements TrainingSessionRepository {
  constructor(private readonly trainingSessions: TrainingSession[]) {}

  async findById(id: string, inputOrganizationId: string): Promise<TrainingSession | null> {
    return (
      this.trainingSessions.find((trainingSession) => {
        const props = trainingSession.toPrimitives();
        return trainingSession.id === id && props.organizationId === inputOrganizationId;
      }) ?? null
    );
  }

  async search(): Promise<PaginatedResult<TrainingSession>> {
    return {
      data: this.trainingSessions,
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
  }

  async save(): Promise<void> {
    return undefined;
  }

  async update(): Promise<void> {
    return undefined;
  }
}

class FakeCourseRepository implements CourseRepository {
  constructor(private readonly courses: Course[]) {}

  async findById(id: string, inputOrganizationId: string): Promise<Course | null> {
    return (
      this.courses.find((course) => {
        const props = course.toPrimitives();
        return course.id === id && props.organizationId === inputOrganizationId;
      }) ?? null
    );
  }

  async findByCode(): Promise<Course | null> {
    return null;
  }

  async search(): Promise<PaginatedResult<Course>> {
    return { data: this.courses, meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
  }

  async save(): Promise<void> {
    return undefined;
  }

  async update(): Promise<void> {
    return undefined;
  }
}

function createEmployee(
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' = 'ACTIVE',
  id = employeeId,
): Employee {
  return {
    id,
    toPrimitives: () => ({
      id,
      organizationId,
      rut: '11.111.111-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      position: 'Engineer',
      department: 'Operations',
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      version: 1,
    }),
  } as Employee;
}

function createCourse(status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' = 'ACTIVE'): Course {
  return {
    id: courseId,
    toPrimitives: () => ({
      id: courseId,
      organizationId,
      code: 'SAFE-001',
      name: 'Safety',
      description: '',
      modality: 'PRESENTIAL',
      durationHours: 8,
      status,
      competencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      version: 1,
    }),
  } as unknown as Course;
}

function createTrainingSession(
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED' = 'PUBLISHED',
  capacity = 1,
): TrainingSession {
  return TrainingSession.rehydrate({
    id: trainingSessionId,
    organizationId,
    courseId,
    trainingPlanItemId: null,
    providerId: null,
    instructorId: null,
    name: 'Safety July',
    startDate: new Date('2026-07-10T13:00:00.000Z'),
    endDate: new Date('2026-07-10T17:00:00.000Z'),
    location: null,
    capacity,
    costAmount: null,
    meetingUrl: null,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    version: 1,
  });
}

function createUseCase(input?: {
  enrollmentRepository?: FakeEnrollmentRepository;
  employee?: Employee;
  trainingSession?: TrainingSession;
  course?: Course;
}): CreateEnrollmentUseCase {
  return new CreateEnrollmentUseCase(
    input?.enrollmentRepository ?? new FakeEnrollmentRepository(),
    new FakeEmployeeRepository([input?.employee ?? createEmployee()] as Employee[]),
    new FakeTrainingSessionRepository([
      input?.trainingSession ?? createTrainingSession(),
    ] as TrainingSession[]),
    new FakeCourseRepository([input?.course ?? createCourse()] as Course[]),
    new NoopAuditLogger(),
  );
}

describe('Enrollments module', () => {
  it('creates a confirmed enrollment when capacity is available', async () => {
    const result = await createUseCase().execute(
      { organizationId, trainingSessionId, employeeId },
      { organizationId, actorUserId: null },
    );

    expect(result.status).toBe('CONFIRMED');
  });

  it('rejects duplicate enrollment for the same employee and session', async () => {
    const enrollmentRepository = new FakeEnrollmentRepository();
    const useCase = createUseCase({ enrollmentRepository });

    await useCase.execute({ organizationId, trainingSessionId, employeeId }, { organizationId, actorUserId: null });

    await expect(
      useCase.execute(
        { organizationId, trainingSessionId, employeeId },
        { organizationId, actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('creates a waitlisted enrollment when no capacity is available', async () => {
    const enrollmentRepository = new FakeEnrollmentRepository();
    await createUseCase({ enrollmentRepository }).execute(
      { organizationId, trainingSessionId, employeeId },
      { organizationId, actorUserId: null },
    );

    const result = await createUseCase({
      enrollmentRepository,
      employee: createEmployee('ACTIVE', '66666666-6666-4666-8666-666666666666'),
    }).execute(
      {
        organizationId,
        trainingSessionId,
        employeeId: '66666666-6666-4666-8666-666666666666',
      },
      { organizationId, actorUserId: null },
    );

    expect(result.status).toBe('WAITLISTED');
  });

  it('promotes the oldest waitlisted enrollment when a confirmed enrollment is cancelled', async () => {
    const enrollmentRepository = new FakeEnrollmentRepository();
    const confirmed = Enrollment.create({
      organizationId,
      trainingSessionId,
      employeeId,
      status: 'CONFIRMED',
    });
    const waitlisted = Enrollment.create({
      organizationId,
      trainingSessionId,
      employeeId: '66666666-6666-4666-8666-666666666666',
      status: 'WAITLISTED',
    });
    enrollmentRepository.enrollments.push(confirmed, waitlisted);

    await new CancelEnrollmentUseCase(enrollmentRepository, new NoopAuditLogger()).execute(
      confirmed.id,
      { organizationId, actorUserId: null },
    );

    expect(waitlisted.toPrimitives().status).toBe('CONFIRMED');
  });

  it('rejects inactive employees', async () => {
    await expect(
      createUseCase({ employee: createEmployee('INACTIVE') }).execute(
        { organizationId, trainingSessionId, employeeId },
        { organizationId, actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects cancelled sessions', async () => {
    await expect(
      createUseCase({ trainingSession: createTrainingSession('CANCELLED') }).execute(
        { organizationId, trainingSessionId, employeeId },
        { organizationId, actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects completed sessions', async () => {
    await expect(
      createUseCase({ trainingSession: createTrainingSession('COMPLETED') }).execute(
        { organizationId, trainingSessionId, employeeId },
        { organizationId, actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects inactive courses', async () => {
    await expect(
      createUseCase({ course: createCourse('INACTIVE') }).execute(
        { organizationId, trainingSessionId, employeeId },
        { organizationId, actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects cross-tenant access', async () => {
    await expect(
      createUseCase().execute(
        { organizationId, trainingSessionId, employeeId },
        { organizationId: otherOrganizationId, actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('lists enrollments by training session', async () => {
    const repository = new FakeEnrollmentRepository();
    repository.enrollments.push(
      Enrollment.create({ organizationId, trainingSessionId, employeeId, status: 'CONFIRMED' }),
    );

    const result = await new ListSessionEnrollmentsUseCase(repository).execute(
      trainingSessionId,
      { organizationId, actorUserId: null },
    );

    expect(result.meta.total).toBe(1);
  });

  it('lists enrollments by employee', async () => {
    const repository = new FakeEnrollmentRepository();
    repository.enrollments.push(
      Enrollment.create({ organizationId, trainingSessionId, employeeId, status: 'CONFIRMED' }),
    );

    const result = await new ListEmployeeEnrollmentsUseCase(repository).execute(
      employeeId,
      { organizationId, actorUserId: null },
    );

    expect(result.meta.total).toBe(1);
  });
});
