import { z } from 'zod';

const organizationTypeSchema = z.enum([
  'CLIENT',
  'CLIENT_COMPANY',
  'OTEC',
  'PROVIDER',
  'HOLDING',
  'INTERNAL',
]);

export const createOrganizationSchema = z.object({
  name: z.string().min(1),
  taxId: z.string().min(1),
  type: organizationTypeSchema,
  legalName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  industry: z.string().min(1).optional(),
  country: z.string().min(2).max(2).default('CL').optional(),
  settings: z.record(z.unknown()).optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();
