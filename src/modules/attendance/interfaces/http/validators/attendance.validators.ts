import { z } from 'zod';

export const attendanceMethodSchema = z.enum(['QR', 'DIGITAL_SIGNATURE', 'MANUAL', 'BIOMETRIC']);
export const attendanceStatusSchema = z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'INCOMPLETE']);

const nullableIsoDateSchema = z.string().datetime().nullable();

export const createAttendanceSchema = z.object({
  organizationId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  trainingSessionId: z.string().uuid(),
  employeeId: z.string().uuid(),
  method: attendanceMethodSchema.optional(),
  status: attendanceStatusSchema,
  checkInAt: nullableIsoDateSchema.optional(),
  checkOutAt: nullableIsoDateSchema.optional(),
  evidenceDocumentId: z.string().uuid().nullable().optional(),
  qrToken: z.string().nullable().optional(),
  signatureStorageKey: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const updateAttendanceSchema = z.object({
  method: attendanceMethodSchema.optional(),
  status: attendanceStatusSchema.optional(),
  checkInAt: nullableIsoDateSchema.optional(),
  checkOutAt: nullableIsoDateSchema.optional(),
  evidenceDocumentId: z.string().uuid().nullable().optional(),
  qrToken: z.string().nullable().optional(),
  signatureStorageKey: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const bulkAttendanceSchema = z.object({
  organizationId: z.string().uuid(),
  trainingSessionId: z.string().uuid(),
  records: z
    .array(
      z.object({
        enrollmentId: z.string().uuid(),
        employeeId: z.string().uuid(),
        status: attendanceStatusSchema,
        method: attendanceMethodSchema.optional(),
        checkInAt: nullableIsoDateSchema.optional(),
        checkOutAt: nullableIsoDateSchema.optional(),
      }),
    )
    .min(1),
});
