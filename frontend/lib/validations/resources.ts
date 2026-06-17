import { z } from 'zod';

export const employeeFormSchema = z.object({
  documentNumber: z.string().min(1, 'Document number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Use a valid email').or(z.literal('')),
  positionName: z.string().optional(),
  areaName: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const courseFormSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  modality: z.enum(['PRESENTIAL', 'ONLINE', 'HYBRID', 'BLENDED', 'ASYNC']),
  durationHours: z.coerce.number().positive('Duration must be greater than zero'),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;
