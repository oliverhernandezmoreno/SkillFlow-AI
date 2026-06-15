import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { AttendanceRepository } from '../../domain/repositories/attendance.repository.js';
import type { AttendanceRecordDto } from '../dto/attendance.dto.js';
import { AttendanceMapper } from '../mappers/attendance.mapper.js';

export class CheckOutUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    attendanceId: string,
    context: UseCaseContext = anonymousUseCaseContext,
    checkedAt = new Date(),
  ): Promise<AttendanceRecordDto> {
    if (!context.organizationId) {
      throw new NotFoundError('Attendance record not found');
    }

    const attendanceRecord = await this.attendanceRepository.findById(
      attendanceId,
      context.organizationId,
    );
    if (!attendanceRecord) {
      throw new NotFoundError('Attendance record not found');
    }

    const before = AttendanceMapper.toDto(attendanceRecord);
    attendanceRecord.checkOut(checkedAt);
    await this.attendanceRepository.update(attendanceRecord);
    const updated = AttendanceMapper.toDto(attendanceRecord);

    await this.auditLogger.record({
      organizationId: context.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'ATTENDANCE',
      entityId: attendanceRecord.id,
      action: 'attendance.checkout',
      metadata: { checkedAt: checkedAt.toISOString() },
      before,
      after: updated,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return updated;
  }
}
