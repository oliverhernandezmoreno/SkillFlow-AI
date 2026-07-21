import { z } from 'zod';

const optionalText = z.string().trim().max(500, 'El valor no puede superar 500 caracteres.').nullable();
const optionalEmail = z.union([
  z.string().trim().email('Ingresa un correo electrónico válido.'),
  z.null(),
]);

export const otecProfileFormSchema = z.object({
  registrationCode: z.string().max(500).default(''),
  rudoReference: z.string().max(500).default(''),
  technicalContactName: z.string().max(500).default(''),
  technicalContactEmail: z.union([z.literal(''), z.string().trim().email('Ingresa un correo electrónico válido.')]),
  technicalContactPhone: z.string().max(500).default(''),
  notes: z.string().max(500).default(''),
}).strict();

export type OtecProfileFormValues = z.infer<typeof otecProfileFormSchema>;

export const createOtecProfileSchema = z.object({
  registrationCode: optionalText.optional(),
  rudoReference: optionalText.optional(),
  technicalContactName: optionalText.optional(),
  technicalContactEmail: optionalEmail.optional(),
  technicalContactPhone: optionalText.optional(),
  notes: optionalText.optional(),
}).strict();

export const updateOtecProfileSchema = createOtecProfileSchema;
export const deactivateOtecProfileSchema = z.object({ reason: z.string().trim().min(1).max(500).optional() }).strict();

export const otecProfileSchema = z.object({
  id: z.string().uuid(),
  registrationCode: optionalText,
  registrationStatus: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CEASED']),
  rudoReference: optionalText,
  accreditationDate: z.string().nullable(),
  suspensionDate: z.string().nullable(),
  cessationDate: z.string().nullable(),
  technicalContactName: optionalText,
  technicalContactEmail: optionalEmail,
  technicalContactPhone: optionalText,
  notes: optionalText,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int().positive(),
}).strict();

export type OtecProfile = z.infer<typeof otecProfileSchema>;
export type OtecProfilePayload = z.infer<typeof createOtecProfileSchema>;
export type DeactivateOtecProfilePayload = z.infer<typeof deactivateOtecProfileSchema>;

export function toOtecProfilePayload(values: OtecProfileFormValues): OtecProfilePayload {
  const nullable = (value: string) => value.trim() || null;
  return {
    registrationCode: nullable(values.registrationCode),
    rudoReference: nullable(values.rudoReference),
    technicalContactName: nullable(values.technicalContactName),
    technicalContactEmail: nullable(values.technicalContactEmail),
    technicalContactPhone: nullable(values.technicalContactPhone),
    notes: nullable(values.notes),
  };
}
