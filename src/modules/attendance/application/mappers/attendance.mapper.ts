import type { AttendanceMetricsDto, AttendanceRecordDto } from '../dto/attendance.dto.js';
import type {
  AttendanceMetrics,
  AttendanceRecord,
} from '../../domain/entities/attendance-record.entity.js';

export class AttendanceMapper {
  static toDto(attendanceRecord: AttendanceRecord): AttendanceRecordDto {
    const props = attendanceRecord.toPrimitives();

    return {
      id: props.id,
      organizationId: props.organizationId,
      enrollmentId: props.enrollmentId,
      trainingSessionId: props.trainingSessionId,
      employeeId: props.employeeId,
      method: props.method,
      status: props.status,
      checkInAt: props.checkInAt?.toISOString() ?? null,
      checkOutAt: props.checkOutAt?.toISOString() ?? null,
      evidenceDocumentId: props.evidenceDocumentId,
      qrToken: props.qrToken,
      signatureStorageKey: props.signatureStorageKey,
      latitude: props.latitude,
      longitude: props.longitude,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }

  static toMetricsDto(
    attendanceRecord: AttendanceRecord,
    metrics: AttendanceMetrics,
  ): AttendanceMetricsDto {
    const props = attendanceRecord.toPrimitives();

    return {
      attendanceId: props.id,
      organizationId: props.organizationId,
      enrollmentId: props.enrollmentId,
      trainingSessionId: props.trainingSessionId,
      employeeId: props.employeeId,
      attendanceMinutes: metrics.attendanceMinutes,
      sessionMinutes: metrics.sessionMinutes,
      attendancePercentage: metrics.attendancePercentage,
      band: metrics.band,
    };
  }
}
