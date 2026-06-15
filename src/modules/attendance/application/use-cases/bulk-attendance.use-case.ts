import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { BadRequestError, ConflictError } from '../../../../shared/domain/errors.js';
import type { EnrollmentRepository } from '../../../enrollments/domain/repositories/enrollment.repository.js';
import type { TrainingSessionRepository } from '../../../training-sessions/domain/repositories/training-session.repository.js';
import { AttendanceRecord } from '../../domain/entities/attendance-record.entity.js';
import type { AttendanceRepository } from '../../domain/repositories/attendance.repository.js';
import type { AttendanceRecordDto, BulkAttendanceDto } from '../dto/attendance.dto.js';
import { AttendanceMapper } from '../mappers/attendance.mapper.js';
import {
  ensureContextOrganization,
  loadAttendanceEnrollment,
  loadAttendanceTrainingSession,
  parseOptionalDate,
} from './attendance-use-case.helpers.js';

export class BulkAttendanceUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly trainingSessionRepository: TrainingSessionRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    input: BulkAttendanceDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<AttendanceRecordDto[]> {
    ensureContextOrganization(input.organizationId, context);
    if (input.records.length === 0) {
      throw new BadRequestError('Bulk attendance must include at least one record');
    }

    await loadAttendanceTrainingSession({
      trainingSessionRepository: this.trainingSessionRepository,
      organizationId: input.organizationId,
      trainingSessionId: input.trainingSessionId,
    });

    const enrollmentIds = new Set<string>();
    const attendanceRecords: AttendanceRecord[] = [];
    for (const record of input.records) {
      if (enrollmentIds.has(record.enrollmentId)) {
        throw new ConflictError('Bulk attendance contains duplicate enrollment records');
      }
      enrollmentIds.add(record.enrollmentId);

      await loadAttendanceEnrollment({
        enrollmentRepository: this.enrollmentRepository,
        organizationId: input.organizationId,
        enrollmentId: record.enrollmentId,
        employeeId: record.employeeId,
        trainingSessionId: input.trainingSessionId,
      });
      const existing = await this.attendanceRepository.findByEnrollment(
        input.organizationId,
        record.enrollmentId,
      );
      if (existing) {
        throw new ConflictError('Enrollment already has an active attendance record');
      }

      attendanceRecords.push(
        AttendanceRecord.create({
          organizationId: input.organizationId,
          enrollmentId: record.enrollmentId,
          trainingSessionId: input.trainingSessionId,
          employeeId: record.employeeId,
          method: record.method,
          status: record.status,
          checkInAt: parseOptionalDate(record.checkInAt),
          checkOutAt: parseOptionalDate(record.checkOutAt),
        }),
      );
    }

    for (const attendanceRecord of attendanceRecords) {
      await this.attendanceRepository.save(attendanceRecord);
    }

    const created = attendanceRecords.map(AttendanceMapper.toDto);
    await this.auditLogger.record({
      organizationId: input.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'ATTENDANCE',
      entityId: null,
      action: 'attendance.bulk',
      metadata: {
        trainingSessionId: input.trainingSessionId,
        count: created.length,
        attendanceIds: created.map((record) => record.id),
      },
      after: created,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return created;
  }
}
