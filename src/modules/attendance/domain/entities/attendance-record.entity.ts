import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';
import { BadRequestError } from '../../../../shared/domain/errors.js';

export type AttendanceMethod = 'QR' | 'DIGITAL_SIGNATURE' | 'MANUAL' | 'BIOMETRIC';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'INCOMPLETE';

export type AttendancePercentageBand = 'FULL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface AttendanceMetrics {
  attendanceMinutes: number;
  sessionMinutes: number;
  attendancePercentage: number;
  band: AttendancePercentageBand;
}

export interface AttendanceRecordProps {
  id: string;
  organizationId: string;
  enrollmentId: string;
  trainingSessionId: string;
  employeeId: string;
  method: AttendanceMethod;
  status: AttendanceStatus;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  evidenceDocumentId: string | null;
  qrToken: string | null;
  signatureStorageKey: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class AttendanceRecord extends AggregateRoot<string> {
  private constructor(private readonly props: AttendanceRecordProps) {
    super(props.id);
  }

  static create(input: {
    organizationId: string;
    enrollmentId: string;
    trainingSessionId: string;
    employeeId: string;
    method?: AttendanceMethod | undefined;
    status: AttendanceStatus;
    checkInAt?: Date | null | undefined;
    checkOutAt?: Date | null | undefined;
    evidenceDocumentId?: string | null | undefined;
    qrToken?: string | null | undefined;
    signatureStorageKey?: string | null | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
  }): AttendanceRecord {
    ensureValidCheckRange(input.checkInAt ?? null, input.checkOutAt ?? null);
    const now = new Date();

    return new AttendanceRecord({
      id: randomUUID(),
      organizationId: input.organizationId,
      enrollmentId: input.enrollmentId,
      trainingSessionId: input.trainingSessionId,
      employeeId: input.employeeId,
      method: input.method ?? 'MANUAL',
      status: input.status,
      checkInAt: input.checkInAt ?? null,
      checkOutAt: input.checkOutAt ?? null,
      evidenceDocumentId: input.evidenceDocumentId ?? null,
      qrToken: input.qrToken ?? null,
      signatureStorageKey: input.signatureStorageKey ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: AttendanceRecordProps): AttendanceRecord {
    ensureValidCheckRange(props.checkInAt, props.checkOutAt);
    return new AttendanceRecord(props);
  }

  update(input: {
    method?: AttendanceMethod | undefined;
    status?: AttendanceStatus | undefined;
    checkInAt?: Date | null | undefined;
    checkOutAt?: Date | null | undefined;
    evidenceDocumentId?: string | null | undefined;
    qrToken?: string | null | undefined;
    signatureStorageKey?: string | null | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
    deletedAt?: Date | null | undefined;
  }): void {
    const checkInAt = input.checkInAt === undefined ? this.props.checkInAt : input.checkInAt;
    const checkOutAt = input.checkOutAt === undefined ? this.props.checkOutAt : input.checkOutAt;
    ensureValidCheckRange(checkInAt, checkOutAt);

    Object.assign(this.props, {
      ...input,
      checkInAt,
      checkOutAt,
      updatedAt: new Date(),
      version: this.props.version + 1,
    });
  }

  checkIn(checkedAt: Date): void {
    this.update({ checkInAt: checkedAt });
  }

  checkOut(checkedAt: Date): void {
    this.update({ checkOutAt: checkedAt });
  }

  calculateMetrics(sessionStartDate: Date, sessionEndDate: Date): AttendanceMetrics {
    const sessionMinutes = calculatePositiveMinutes(sessionStartDate, sessionEndDate);
    const attendanceMinutes =
      this.props.checkInAt && this.props.checkOutAt
        ? calculatePositiveMinutes(this.props.checkInAt, this.props.checkOutAt)
        : 0;
    const attendancePercentage =
      sessionMinutes === 0 ? 0 : Math.min(100, Math.round((attendanceMinutes / sessionMinutes) * 100));

    return {
      attendanceMinutes,
      sessionMinutes,
      attendancePercentage,
      band: resolvePercentageBand(attendancePercentage),
    };
  }

  toPrimitives(): AttendanceRecordProps {
    return { ...this.props };
  }
}

function ensureValidCheckRange(checkInAt: Date | null, checkOutAt: Date | null): void {
  if (checkInAt && checkOutAt && checkOutAt.getTime() < checkInAt.getTime()) {
    throw new BadRequestError('Attendance check-out time must be after check-in time');
  }
}

function calculatePositiveMinutes(startDate: Date, endDate: Date): number {
  const minutes = Math.floor((endDate.getTime() - startDate.getTime()) / 60000);
  return Math.max(0, minutes);
}

function resolvePercentageBand(attendancePercentage: number): AttendancePercentageBand {
  if (attendancePercentage === 100) {
    return 'FULL';
  }
  if (attendancePercentage >= 80) {
    return 'HIGH';
  }
  if (attendancePercentage >= 50) {
    return 'MEDIUM';
  }
  return 'LOW';
}
