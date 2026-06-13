import { z } from 'zod';

export const createUserSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1).nullable().optional(),
  roleIds: z.array(z.string().uuid()),
  password: z.string().min(8).optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(1).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'INVITED', 'LOCKED', 'SUSPENDED']).optional(),
  roleIds: z.array(z.string().uuid()).optional(),
  password: z.string().min(8).optional(),
});
