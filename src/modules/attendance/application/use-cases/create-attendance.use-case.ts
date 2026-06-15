import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ConflictError } from '../../../../shared/domain/errors.js';
import type { EnrollmentRepository } from '../../../enrollments/domain/repositories/enrollment.repository.js';
import type { TrainingSessionRepository } from '../../../training-sessions/domain/repositories/training-session.repository.js';
import { AttendanceRecord } from '../../domain/entities/attendance-record.entity.js';
import type { AttendanceRepository } from '../../domain/repositories/attendance.repository.js';
import type { AttendanceRecordDto, CreateAttendanceDto } from '../dto/attendance.dto.js';
import { AttendanceMapper } from '../mappers/attendance.mapper.js';
import {
  ensureContextOrganization,
  loadAttendanceEnrollment,
  loadAttendanceTrainingSession,
  parseOptionalDate,
} from './attendance-use-case.helpers.js';

export class CreateAttendanceUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly trainingSessionRepository: TrainingSessionRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    input: CreateAttendanceDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<AttendanceRecordDto> {
    ensureContextOrganization(input.organizationId, context);
    await loadAttendanceEnrollment({
      enrollmentRepository: this.enrollmentRepository,
      organizationId: input.organizationId,
      enrollmentId: input.enrollmentId,
      employeeId: input.employeeId,
      trainingSessionId: input.trainingSessionId,
    });
    await loadAttendanceTrainingSession({
      trainingSessionRepository: this.trainingSessionRepository,
      organizationId: input.organizationId,
      trainingSessionId: input.trainingSessionId,
    });

    const existing = await this.attendanceRepository.findByEnrollment(
      input.organizationId,
      input.enrollmentId,
    );
    if (existing) {
      throw new ConflictError('Enrollment already has an active attendance record');
    }

    const attendanceRecord = AttendanceRecord.create({
      organizationId: input.organizationId,
      enrollmentId: input.enrollmentId,
      trainingSessionId: input.trainingSessionId,
      employeeId: input.employeeId,
      method: input.method,
      status: input.status,
      checkInAt: parseOptionalDate(input.checkInAt),
      checkOutAt: parseOptionalDate(input.checkOutAt),
      evidenceDocumentId: input.evidenceDocumentId,
      qrToken: input.qrToken,
      signatureStorageKey: input.signatureStorageKey,
      latitude: input.latitude,
      longitude: input.longitude,
    });

    await this.attendanceRepository.save(attendanceRecord);
    const created = AttendanceMapper.toDto(attendanceRecord);
    await this.auditLogger.record({
      organizationId: input.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'ATTENDANCE',
      entityId: attendanceRecord.id,
      action: 'attendance.create',
      metadata: {
        enrollmentId: input.enrollmentId,
        trainingSessionId: input.trainingSessionId,
        employeeId: input.employeeId,
      },
      after: created,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return created;
  }
}
