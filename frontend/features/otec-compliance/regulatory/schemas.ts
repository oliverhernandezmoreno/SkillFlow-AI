import { z } from 'zod';

const optionalText = z.string().trim().max(500).nullable();
const optionalDate = z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ingresa una fecha válida.')]);
const dateRange = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict().superRefine((value, context) => {
  const record = value as Record<string, unknown>;
  if (record.validFrom && record.validUntil && record.validFrom > record.validUntil) {
    context.addIssue({ code: 'custom', path: ['validUntil'], message: 'La fecha de término debe ser igual o posterior a la fecha de inicio.' });
  }
});

export const accreditationFormSchema = dateRange({
  accreditationType: z.string().trim().min(1, 'Ingresa el tipo de acreditación.'),
  accreditationNumber: z.string().trim().min(1, 'Ingresa el número de acreditación.'),
  issuedAt: optionalDate, validFrom: optionalDate, validUntil: optionalDate,
  issuingAuthority: z.string().max(500), source: z.string().max(500), externalReference: z.string().max(500), notes: z.string().max(500),
});
export type AccreditationFormValues = z.infer<typeof accreditationFormSchema>;

export const certificationFormSchema = dateRange({
  certificationType: z.enum(['NCH_2728', 'ISO_9001', 'OTHER']),
  certificationNumber: z.string().trim().min(1, 'Ingresa el número de certificación.'),
  certifyingEntity: z.string().trim().min(1, 'Ingresa la entidad certificadora.'),
  scope: z.string().max(500), issuedAt: optionalDate, validFrom: optionalDate, validUntil: optionalDate,
  documentId: z.union([z.literal(''), z.string().uuid('Ingresa un identificador de documento válido.')]), notes: z.string().max(500),
});
export type CertificationFormValues = z.infer<typeof certificationFormSchema>;

const commonResponse = {
  id: z.string().uuid(), otecProfileId: z.string().uuid(), status: z.string(),
  issuedAt: z.string().nullable(), validFrom: z.string().nullable(), validUntil: z.string().nullable(),
  notes: optionalText, createdAt: z.string().datetime(), updatedAt: z.string().datetime(), version: z.number().int().positive(),
};
export const accreditationSchema = z.object({
  ...commonResponse, accreditationType: z.string(), accreditationNumber: z.string(), suspendedAt: z.string().nullable(), revokedAt: z.string().nullable(),
  issuingAuthority: optionalText, source: optionalText, externalReference: optionalText,
}).strict();
export const certificationSchema = z.object({
  ...commonResponse, certificationType: z.enum(['NCH_2728', 'ISO_9001', 'OTHER']), certificationNumber: z.string(), certifyingEntity: z.string(), scope: optionalText, documentId: z.string().uuid().nullable(),
}).strict();
export type OtecAccreditation = z.infer<typeof accreditationSchema>;
export type QualityCertification = z.infer<typeof certificationSchema>;

export const accreditationPayloadSchema = z.object({
  accreditationType: z.string().trim().min(1), accreditationNumber: z.string().trim().min(1),
  issuedAt: z.string().nullable().optional(), validFrom: z.string().nullable().optional(), validUntil: z.string().nullable().optional(),
  issuingAuthority: optionalText.optional(), source: optionalText.optional(), externalReference: optionalText.optional(), notes: optionalText.optional(),
}).strict();
export const certificationPayloadSchema = z.object({
  certificationType: z.enum(['NCH_2728', 'ISO_9001', 'OTHER']), certificationNumber: z.string().trim().min(1), certifyingEntity: z.string().trim().min(1), scope: optionalText.optional(),
  issuedAt: z.string().nullable().optional(), validFrom: z.string().nullable().optional(), validUntil: z.string().nullable().optional(), documentId: z.string().uuid().nullable().optional(), notes: optionalText.optional(),
}).strict();
export type AccreditationPayload = z.infer<typeof accreditationPayloadSchema>;
export type CertificationPayload = z.infer<typeof certificationPayloadSchema>;
export type RegulatoryFilters = { page: number; pageSize: number; status?: string; type?: string; validAt?: string; validFromAfter?: string; validUntilFrom?: string; validUntilBefore?: string };
export type Page<T> = { data: T[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };

const nullable = (value: string) => value.trim() || null;
const date = (value: string) => value || null;
export function toAccreditationPayload(values: AccreditationFormValues): AccreditationPayload {
  return { accreditationType: values.accreditationType.trim(), accreditationNumber: values.accreditationNumber.trim(), issuedAt: date(values.issuedAt), validFrom: date(values.validFrom), validUntil: date(values.validUntil), issuingAuthority: nullable(values.issuingAuthority), source: nullable(values.source), externalReference: nullable(values.externalReference), notes: nullable(values.notes) };
}
export function toCertificationPayload(values: CertificationFormValues): CertificationPayload {
  return { certificationType: values.certificationType, certificationNumber: values.certificationNumber.trim(), certifyingEntity: values.certifyingEntity.trim(), scope: nullable(values.scope), issuedAt: date(values.issuedAt), validFrom: date(values.validFrom), validUntil: date(values.validUntil), documentId: nullable(values.documentId), notes: nullable(values.notes) };
}
