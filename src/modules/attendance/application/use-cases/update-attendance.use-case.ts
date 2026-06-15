import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { AttendanceRepository } from '../../domain/repositories/attendance.repository.js';
import type { AttendanceRecordDto, UpdateAttendanceDto } from '../dto/attendance.dto.js';
import { AttendanceMapper } from '../mappers/attendance.mapper.js';
import { ensureContextOrganization, parseOptionalDate } from './attendance-use-case.helpers.js';

export class UpdateAttendanceUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    attendanceId: string,
    input: UpdateAttendanceDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<AttendanceRecordDto> {
    const organizationId = context.organizationId;
    if (!organizationId) {
      throw new NotFoundError('Attendance record not found');
    }
    const attendanceRecord = await this.attendanceRepository.findById(attendanceId, organizationId);
    if (!attendanceRecord) {
      throw new NotFoundError('Attendance record not found');
    }
    ensureContextOrganization(organizationId, context);

    const before = AttendanceMapper.toDto(attendanceRecord);
    attendanceRecord.update({
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
    await this.attendanceRepository.update(attendanceRecord);
    const updated = AttendanceMapper.toDto(attendanceRecord);

    await this.auditLogger.record({
      organizationId,
      actorUserId: context.actorUserId,
      entityType: 'ATTENDANCE',
      entityId: attendanceRecord.id,
      action: 'attendance.update',
      metadata: {},
      before,
      after: updated,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return updated;
  }
}
