import { z } from 'zod';

export const createEmployeeSchema = z.object({
  organizationId: z.string().uuid(),
  documentNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  positionName: z.string().min(1).optional(),
  areaName: z.string().min(1).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).optional(),
});
