import { z } from 'zod';

const trainingPlanStatusSchema = z.enum([
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
  'EXECUTING',
  'COMPLETED',
]);

const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const createTrainingPlanSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  budgetAmount: z.number().nonnegative(),
  currency: z.string().min(3).max(3).optional(),
});

export const updateTrainingPlanSchema = z.object({
  name: z.string().min(1).optional(),
  status: trainingPlanStatusSchema.optional(),
  budgetAmount: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(3).optional(),
});

export const createTrainingPlanItemSchema = z.object({
  courseId: z.string().uuid(),
  plannedMonth: z.number().int().min(1).max(12).nullable().optional(),
  quarter: z.number().int().min(1).max(4).nullable().optional(),
  estimatedParticipants: z.number().int().positive(),
  estimatedCost: z.number().nonnegative(),
  priority: prioritySchema.optional(),
  businessJustification: z.string().min(1).nullable().optional(),
  targetCompetencies: z.array(z.string().min(1)).optional(),
});

export function parseTrainingPlanStatus(value: string | undefined) {
  return value ? trainingPlanStatusSchema.parse(value) : undefined;
}
