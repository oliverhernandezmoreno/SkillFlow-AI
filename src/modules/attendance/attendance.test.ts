import { describe, expect, it } from 'vitest';

import { NoopAuditLogger } from '../../shared/application/audit-logger.js';
import type { PaginatedResult, PaginationInput } from '../../shared/application/pagination.js';
import { BadRequestError, ConflictError, ForbiddenError } from '../../shared/domain/errors.js';
import { Enrollment } from '../enrollments/domain/entities/enrollment.entity.js';
import type {
  CreateEnrollmentCapacityInput,
  EnrollmentRepository,
  EnrollmentSearchFilters,
} from '../enrollments/domain/repositories/enrollment.repository.js';
import { TrainingSession } from '../training-sessions/domain/entities/training-session.entity.js';
import type { TrainingSessionRepository } from '../training-sessions/domain/repositories/training-session.repository.js';
import { BulkAttendanceUseCase } from './application/use-cases/bulk-attendance.use-case.js';
import { CalculateAttendanceMetricsUseCase } from './application/use-cases/calculate-attendance-metrics.use-case.js';
import { CheckInUseCase } from './application/use-cases/check-in.use-case.js';
import { CheckOutUseCase } from './application/use-cases/check-out.use-case.js';
import { CreateAttendanceUseCase } from './application/use-cases/create-attendance.use-case.js';
import { ListEmployeeAttendanceUseCase } from './application/use-cases/list-employee-attendance.use-case.js';
import { ListSessionAttendanceUseCase } from './application/use-cases/list-session-attendance.use-case.js';
import { AttendanceRecord } from './domain/entities/attendance-record.entity.js';
import type {
  AttendanceRepository,
  AttendanceSearchFilters,
} from './domain/repositories/attendance.repository.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const otherOrganizationId = '22222222-2222-4222-8222-222222222222';
const enrollmentId = '33333333-3333-4333-8333-333333333333';
const employeeId = '44444444-4444-4444-8444-444444444444';
const trainingSessionId = '55555555-5555-4555-8555-555555555555';
const secondEnrollmentId = '66666666-6666-4666-8666-666666666666';
const secondEmployeeId = '77777777-7777-4777-8777-777777777777';
const courseId = '88888888-8888-4888-8888-888888888888';

class FakeAttendanceRepository implements AttendanceRepository {
  attendanceRecords: AttendanceRecord[] = [];

  async findById(id: string, inputOrganizationId: string): Promise<AttendanceRecord | null> {
    return (
      this.attendanceRecords.find((attendanceRecord) => {
        const props = attendanceRecord.toPrimitives();
        return attendanceRecord.id === id && props.organizationId === inputOrganizationId;
      }) ?? null
    );
  }

  async findByEnrollment(
    inputOrganizationId: string,
    inputEnrollmentId: string,
  ): Promise<AttendanceRecord | null> {
    return (
      this.attendanceRecords.find((attendanceRecord) => {
        const props = attendanceRecord.toPrimitives();
        return (
          props.organizationId === inputOrganizationId &&
          props.enrollmentId === inputEnrollmentId &&
          props.deletedAt === null
        );
      }) ?? null
    );
  }

  async search(
    filters: AttendanceSearchFilters,
    _pagination: PaginationInput,
  ): Promise<PaginatedResult<AttendanceRecord>> {
    const data = this.attendanceRecords.filter((attendanceRecord) => {
      const props = attendanceRecord.toPrimitives();
      return (
        props.organizationId === filters.organizationId &&
        (filters.trainingSessionId === undefined ||
          props.trainingSessionId === filters.trainingSessionId) &&
        (filters.employeeId === undefined || props.employeeId === filters.employeeId) &&
        (filters.enrollmentId === undefined || props.enrollmentId === filters.enrollmentId) &&
        (filters.status === undefined || props.status === filters.status)
      );
    });

    return { data, meta: { page: 1, pageSize: 20, total: data.length, totalPages: 1 } };
  }

  async save(attendanceRecord: AttendanceRecord): Promise<void> {
    this.attendanceRecords.push(attendanceRecord);
  }

  async update(attendanceRecord: AttendanceRecord): Promise<void> {
    const props = attendanceRecord.toPrimitives();
    this.attendanceRecords = this.attendanceRecords.map((current) => {
      const currentProps = current.toPrimitives();
      return current.id === attendanceRecord.id && currentProps.organizationId === props.organizationId
        ? attendanceRecord
        : current;
    });
  }
}

class FakeEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly enrollments: Enrollment[]) {}

  async findById(id: string, inputOrganizationId: string): Promise<Enrollment | null> {
    return (
      this.enrollments.find((enrollment) => {
        const props = enrollment.toPrimitives();
        return enrollment.id === id && props.organizationId === inputOrganizationId;
      }) ?? null
    );
  }

  async findBySessionAndEmployee(): Promise<Enrollment | null> {
    return null;
  }

  async search(
    _filters: EnrollmentSearchFilters,
    _pagination: PaginationInput,
  ): Promise<PaginatedResult<Enrollment>> {
    return {
      data: this.enrollments,
      meta: { page: 1, pageSize: 20, total: this.enrollments.length, totalPages: 1 },
    };
  }

  async createWithCapacity(_input: CreateEnrollmentCapacityInput): Promise<Enrollment> {
    throw new Error('Not implemented');
  }

  async countOccupiedSeats(): Promise<number> {
    return 0;
  }

  async findOldestWaitlisted(): Promise<Enrollment | null> {
    return null;
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
      meta: { page: 1, pageSize: 20, total: this.trainingSessions.length, totalPages: 1 },
    };
  }

  async save(): Promise<void> {
    return undefined;
  }

  async update(): Promise<void> {
    return undefined;
  }
}

function createEnrollment(
  status: 'PENDING' | 'CONFIRMED' | 'WAITLISTED' | 'ENROLLED' | 'CANCELLED' | 'COMPLETED' | 'FAILED' = 'CONFIRMED',
  id = enrollmentId,
  inputEmployeeId = employeeId,
): Enrollment {
  return Enrollment.rehydrate({
    id,
    organizationId,
    trainingSessionId,
    employeeId: inputEmployeeId,
    status,
    enrolledAt: new Date('2026-07-10T12:00:00.000Z'),
    completionPercentage: null,
    finalScore: null,
    approved: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    version: 1,
  });
}

function createTrainingSession(): TrainingSession {
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
    capacity: 20,
    costAmount: null,
    meetingUrl: null,
    status: 'PUBLISHED',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    version: 1,
  });
}

function createAttendanceRepositoryWithRecord(): {
  repository: FakeAttendanceRepository;
  attendanceRecord: AttendanceRecord;
} {
  const repository = new FakeAttendanceRepository();
  const attendanceRecord = AttendanceRecord.create({
    organizationId,
    enrollmentId,
    trainingSessionId,
    employeeId,
    status: 'PRESENT',
  });
  repository.attendanceRecords.push(attendanceRecord);
  return { repository, attendanceRecord };
}

function createUseCase(input?: {
  attendanceRepository?: FakeAttendanceRepository;
  enrollment?: Enrollment;
  trainingSession?: TrainingSession;
}): CreateAttendanceUseCase {
  return new CreateAttendanceUseCase(
    input?.attendanceRepository ?? new FakeAttendanceRepository(),
    new FakeEnrollmentRepository([input?.enrollment ?? createEnrollment()]),
    new FakeTrainingSessionRepository([input?.trainingSession ?? createTrainingSession()]),
    new NoopAuditLogger(),
  );
}

describe('Attendance module', () => {
  it('creates manual attendance successfully', async () => {
    const result = await createUseCase().execute(
      { organizationId, enrollmentId, trainingSessionId, employeeId, status: 'PRESENT' },
      { organizationId, actorUserId: null },
    );

    expect(result.method).toBe('MANUAL');
    expect(result.status).toBe('PRESENT');
  });

  it('rejects duplicate attendance for the same enrollment', async () => {
    const attendanceRepository = new FakeAttendanceRepository();
    const useCase = createUseCase({ attendanceRepository });

    await useCase.execute(
      { organizationId, enrollmentId, trainingSessionId, employeeId, status: 'PRESENT' },
      { organizationId, actorUserId: null },
    );

    await expect(
      useCase.execute(
        { organizationId, enrollmentId, trainingSessionId, employeeId, status: 'ABSENT' },
        { organizationId, actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects cancelled enrollments', async () => {
    await expect(
      createUseCase({ enrollment: createEnrollment('CANCELLED') }).execute(
        { organizationId, enrollmentId, trainingSessionId, employeeId, status: 'PRESENT' },
        { organizationId, actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects failed enrollments as rejected equivalent', async () => {
    await expect(
      createUseCase({ enrollment: createEnrollment('FAILED') }).execute(
        { organizationId, enrollmentId, trainingSessionId, employeeId, status: 'PRESENT' },
        { organizationId, actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects cross-tenant attendance access', async () => {
    await expect(
      createUseCase().execute(
        { organizationId, enrollmentId, trainingSessionId, employeeId, status: 'PRESENT' },
        { organizationId: otherOrganizationId, actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('checks in an attendance record', async () => {
    const { repository, attendanceRecord } = createAttendanceRepositoryWithRecord();
    const checkedAt = new Date('2026-07-10T13:05:00.000Z');

    const result = await new CheckInUseCase(repository, new NoopAuditLogger()).execute(
      attendanceRecord.id,
      { organizationId, actorUserId: null },
      checkedAt,
    );

    expect(result.checkInAt).toBe(checkedAt.toISOString());
  });

  it('checks out an attendance record', async () => {
    const { repository, attendanceRecord } = createAttendanceRepositoryWithRecord();
    attendanceRecord.checkIn(new Date('2026-07-10T13:00:00.000Z'));
    const checkedAt = new Date('2026-07-10T17:00:00.000Z');

    const result = await new CheckOutUseCase(repository, new NoopAuditLogger()).execute(
      attendanceRecord.id,
      { organizationId, actorUserId: null },
      checkedAt,
    );

    expect(result.checkOutAt).toBe(checkedAt.toISOString());
  });

  it('calculates attendance percentage metrics', async () => {
    const { repository, attendanceRecord } = createAttendanceRepositoryWithRecord();
    attendanceRecord.checkIn(new Date('2026-07-10T13:00:00.000Z'));
    attendanceRecord.checkOut(new Date('2026-07-10T15:00:00.000Z'));

    const result = await new CalculateAttendanceMetricsUseCase(
      repository,
      new FakeTrainingSessionRepository([createTrainingSession()]),
    ).execute(attendanceRecord.id, { organizationId, actorUserId: null });

    expect(result.attendanceMinutes).toBe(120);
    expect(result.sessionMinutes).toBe(240);
    expect(result.attendancePercentage).toBe(50);
    expect(result.band).toBe('MEDIUM');
  });

  it('creates attendance records in bulk', async () => {
    const attendanceRepository = new FakeAttendanceRepository();
    const result = await new BulkAttendanceUseCase(
      attendanceRepository,
      new FakeEnrollmentRepository([
        createEnrollment(),
        createEnrollment('CONFIRMED', secondEnrollmentId, secondEmployeeId),
      ]),
      new FakeTrainingSessionRepository([createTrainingSession()]),
      new NoopAuditLogger(),
    ).execute(
      {
        organizationId,
        trainingSessionId,
        records: [
          { enrollmentId, employeeId, status: 'PRESENT' },
          { enrollmentId: secondEnrollmentId, employeeId: secondEmployeeId, status: 'LATE' },
        ],
      },
      { organizationId, actorUserId: null },
    );

    expect(result).toHaveLength(2);
    expect(attendanceRepository.attendanceRecords).toHaveLength(2);
  });

  it('lists attendance by training session', async () => {
    const { repository } = createAttendanceRepositoryWithRecord();

    const result = await new ListSessionAttendanceUseCase(repository).execute(trainingSessionId, {
      organizationId,
      actorUserId: null,
    });

    expect(result.meta.total).toBe(1);
  });

  it('lists attendance by employee', async () => {
    const { repository } = createAttendanceRepositoryWithRecord();

    const result = await new ListEmployeeAttendanceUseCase(repository).execute(employeeId, {
      organizationId,
      actorUserId: null,
    });

    expect(result.meta.total).toBe(1);
  });
});
