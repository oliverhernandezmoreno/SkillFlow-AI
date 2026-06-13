import { z } from 'zod';

function normalizeModality(modality: string): 'PRESENTIAL' | 'ONLINE' | 'HYBRID' {
  if (modality === 'BLENDED') {
    return 'HYBRID';
  }
  if (modality === 'ASYNC') {
    return 'ONLINE';
  }
  return modality as 'PRESENTIAL' | 'ONLINE' | 'HYBRID';
}

const modalitySchema = z
  .enum(['ONLINE', 'PRESENTIAL', 'HYBRID', 'BLENDED', 'ASYNC'])
  .transform(normalizeModality);

export const createCourseSchema = z.object({
  organizationId: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  modality: modalitySchema,
  durationHours: z.number().positive(),
  competencyIds: z.array(z.string()).optional(),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
});
