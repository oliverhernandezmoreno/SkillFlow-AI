import { z } from 'zod';
const t = z.string().trim().min(1, 'Este campo es obligatorio.');
const d = z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]);
const n = z.string().trim().nullable();
export const resolutionFormSchema = z
  .object({
    resolutionType: z.enum([
      'ACCREDITATION',
      'AUTHORIZATION',
      'MODIFICATION',
      'SUSPENSION',
      'CESSATION',
      'OTHER',
    ]),
    resolutionNumber: t,
    issuingAuthority: t,
    issuedAt: d.refine(Boolean, 'La fecha de emisión es obligatoria.'),
    validFrom: d,
    validUntil: d,
    scope: z.string(),
    documentId: z.union([z.literal(''), z.string().uuid()]),
    notes: z.string(),
  })
  .strict()
  .refine((v) => !v.validFrom || !v.validUntil || v.validFrom <= v.validUntil, {
    path: ['validUntil'],
    message: 'La fecha final debe ser posterior.',
  });
export type ResolutionForm = z.infer<typeof resolutionFormSchema>;
export const resolutionSchema = z
  .object({
    id: z.string().uuid(),
    otecProfileId: z.string().uuid(),
    resolutionType: z.string(),
    resolutionNumber: z.string(),
    issuingAuthority: z.string(),
    issuedAt: z.string(),
    validFrom: z.string().nullable(),
    validUntil: z.string().nullable(),
    status: z.string(),
    scope: n,
    supersedesResolutionId: z.string().uuid().nullable(),
    documentId: z.string().uuid().nullable(),
    notes: n,
    createdAt: z.string(),
    updatedAt: z.string(),
    version: z.number(),
  })
  .strict();
export type Resolution = z.infer<typeof resolutionSchema>;
export type Filters = {
  page: number;
  pageSize: number;
  status?: string;
  type?: string;
  validAt?: string;
};
export const payload = (v: ResolutionForm) => ({
  resolutionType: v.resolutionType,
  resolutionNumber: v.resolutionNumber.trim(),
  issuingAuthority: v.issuingAuthority.trim(),
  issuedAt: v.issuedAt,
  validFrom: v.validFrom || null,
  validUntil: v.validUntil || null,
  scope: v.scope.trim() || null,
  documentId: v.documentId || null,
  notes: v.notes.trim() || null,
});
export const findingSchema = z
  .object({
    code: z.string().min(1),
    severity: z.string(),
    message: z.string(),
    remediation: z.string().optional(),
  })
  .passthrough()
  .superRefine((finding, context) => {
    if (Object.prototype.hasOwnProperty.call(finding, 'ruleCode')) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Readiness findings must use the public code field.',
        path: ['ruleCode'],
      });
    }
  });
export const readinessSchema = z
  .object({
    otecProfileId: z.string().uuid().nullable(),
    status: z.enum(['READY', 'READY_WITH_WARNINGS', 'NOT_READY']),
    evaluatedAt: z.string(),
    score: z.number(),
    policyVersion: z.string(),
    blockingIssues: z.array(findingSchema),
    warnings: z.array(findingSchema),
    passedChecks: z.array(findingSchema),
    findings: z.array(findingSchema),
    expiringItems: z.array(findingSchema),
    missingItems: z.array(findingSchema),
    metadata: z.object({
      basis: z.literal('INTERNAL_CONFIGURED_RECORDS'),
      officialValidation: z.literal(false),
    }),
  })
  .strict();
export type Readiness = z.infer<typeof readinessSchema>;
export const summarySchema = z
  .object({
    otecProfileId: z.string().uuid().nullable(),
    status: z.string(),
    evaluatedAt: z.string(),
    policyVersion: z.string(),
    blockingCount: z.number(),
    warningCount: z.number(),
    passedRuleCount: z.number(),
    missingItemCount: z.number(),
    expiringItemCount: z.number(),
    metadata: z.object({ basis: z.string(), officialValidation: z.boolean() }),
  })
  .passthrough();
