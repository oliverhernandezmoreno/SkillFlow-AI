import { z } from 'zod';

export const enrollmentStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'WAITLISTED',
  'ENROLLED',
  'CANCELLED',
  'COMPLETED',
  'FAILED',
]);

export const createEnrollmentSchema = z.object({
  organizationId: z.string().uuid(),
  trainingSessionId: z.string().uuid(),
  employeeId: z.string().uuid(),
});

export const updateEnrollmentSchema = z.object({
  status: enrollmentStatusSchema.optional(),
  completionPercentage: z.number().min(0).max(100).nullable().optional(),
  finalScore: z.number().min(0).max(100).nullable().optional(),
  approved: z.boolean().nullable().optional(),
});
