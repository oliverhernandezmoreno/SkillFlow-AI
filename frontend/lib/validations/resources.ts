import { z } from 'zod';

export const employeeFormSchema = z.object({
  documentNumber: z.string().min(1, 'El RUT es obligatorio'),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  email: z.string().email('Usa un correo válido').or(z.literal('')),
  positionName: z.string().optional(),
  areaName: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const courseFormSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  modality: z.enum(['PRESENTIAL', 'ONLINE', 'HYBRID', 'BLENDED', 'ASYNC']),
  durationHours: z.coerce.number().positive('La duración debe ser mayor que cero'),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

export const trainingSessionFormSchema = z
  .object({
    courseId: z.string().uuid('Selecciona un curso'),
    name: z.string().min(1, 'El nombre de la sesión es obligatorio'),
    startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
    endDate: z.string().min(1, 'La fecha de término es obligatoria'),
    location: z.string().optional(),
    capacity: z.coerce.number().int().min(1, 'La capacidad debe ser al menos 1'),
    meetingUrl: z.string().url('Usa una URL de reunión válida').or(z.literal('')),
  })
  .refine((values) => new Date(values.endDate).getTime() > new Date(values.startDate).getTime(), {
    message: 'La fecha de término debe ser posterior al inicio',
    path: ['endDate'],
  });

export type TrainingSessionFormValues = z.infer<typeof trainingSessionFormSchema>;

export const enrollmentFormSchema = z.object({
  employeeId: z.string().uuid('Selecciona un colaborador'),
  trainingSessionId: z.string().uuid('Selecciona una sesión'),
});

export type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;
