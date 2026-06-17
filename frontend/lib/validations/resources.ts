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

export const trainingSessionFormSchema = z
  .object({
    courseId: z.string().uuid('Select a course'),
    name: z.string().min(1, 'Session name is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    location: z.string().optional(),
    capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
    meetingUrl: z.string().url('Use a valid meeting URL').or(z.literal('')),
  })
  .refine((values) => new Date(values.endDate).getTime() > new Date(values.startDate).getTime(), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export type TrainingSessionFormValues = z.infer<typeof trainingSessionFormSchema>;

export const enrollmentFormSchema = z.object({
  employeeId: z.string().uuid('Select an employee'),
  trainingSessionId: z.string().uuid('Select a session'),
});

export type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;
