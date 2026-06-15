import { z } from 'zod';

export const createTrainingSessionSchema = z.object({
  organizationId: z.string().uuid(),
  courseId: z.string().uuid(),
  trainingPlanItemId: z.string().uuid().nullable().optional(),
  providerId: z.string().uuid().nullable().optional(),
  instructorId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  location: z.string().nullable().optional(),
  capacity: z.number().int().positive(),
  costAmount: z.number().nonnegative().nullable().optional(),
  meetingUrl: z.string().url().nullable().optional(),
});

export const updateTrainingSessionSchema = createTrainingSessionSchema.partial().extend({
  status: z
    .enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CLOSED'])
    .optional(),
});
