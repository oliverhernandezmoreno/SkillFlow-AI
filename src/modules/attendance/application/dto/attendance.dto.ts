import type {
  AttendanceMethod,
  AttendancePercentageBand,
  AttendanceStatus,
} from '../../domain/entities/attendance-record.entity.js';

export interface AttendanceRecordDto {
  id: string;
  organizationId: string;
  enrollmentId: string;
  trainingSessionId: string;
  employeeId: string;
  method: AttendanceMethod;
  status: AttendanceStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
  evidenceDocumentId: string | null;
  qrToken: string | null;
  signatureStorageKey: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendanceDto {
  organizationId: string;
  enrollmentId: string;
  trainingSessionId: string;
  employeeId: string;
  method?: AttendanceMethod | undefined;
  status: AttendanceStatus;
  checkInAt?: string | null | undefined;
  checkOutAt?: string | null | undefined;
  evidenceDocumentId?: string | null | undefined;
  qrToken?: string | null | undefined;
  signatureStorageKey?: string | null | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
}

export interface UpdateAttendanceDto {
  method?: AttendanceMethod | undefined;
  status?: AttendanceStatus | undefined;
  checkInAt?: string | null | undefined;
  checkOutAt?: string | null | undefined;
  evidenceDocumentId?: string | null | undefined;
  qrToken?: string | null | undefined;
  signatureStorageKey?: string | null | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
}

export interface BulkAttendanceRecordDto {
  enrollmentId: string;
  employeeId: string;
  status: AttendanceStatus;
  method?: AttendanceMethod | undefined;
  checkInAt?: string | null | undefined;
  checkOutAt?: string | null | undefined;
}

export interface BulkAttendanceDto {
  organizationId: string;
  trainingSessionId: string;
  records: BulkAttendanceRecordDto[];
}

export interface AttendanceMetricsDto {
  attendanceId: string;
  organizationId: string;
  enrollmentId: string;
  trainingSessionId: string;
  employeeId: string;
  attendanceMinutes: number;
  sessionMinutes: number;
  attendancePercentage: number;
  band: AttendancePercentageBand;
}
