import { z } from 'zod';

export const createInstructorSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  providerId: z.string().uuid().nullable().optional(),
  rut: z.string().min(1).nullable().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  specialties: z.array(z.string().min(1)).optional(),
});

export const updateInstructorSchema = createInstructorSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
});
