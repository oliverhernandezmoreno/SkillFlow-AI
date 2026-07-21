import { z } from 'zod';

const uuid = z.string().uuid();
const nullableText = z.string().trim().min(1).nullable().optional();
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((value) => new Date(`${value}T00:00:00.000Z`));
const optionalDate = isoDate.nullable().optional();
const dateRange = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object(shape)
  .strict()
  .superRefine((value, context) => {
    const fields = value as Record<string, unknown>;
    const from = fields['validFrom'];
    const until = fields['validUntil'];
      if (from instanceof Date && until instanceof Date && from > until) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['validUntil'],
          message: 'validUntil must be on or after validFrom',
        });
      }
    });

export const createOfficeBodySchema = dateRange({
  otecProfileId: uuid,
  officeCode: z.string().trim().min(1),
  name: z.string().trim().min(1),
  officeType: z.enum(['HEADQUARTERS', 'BRANCH', 'OPERATING_OFFICE', 'TRAINING_SITE', 'OTHER']),
  street: z.string().trim().min(1),
  city: z.string().trim().min(1),
  commune: z.string().trim().min(1),
  region: z.string().trim().min(1),
  country: z.string().length(2),
  postalCode: nullableText,
  email: z.string().email().nullable().optional(),
  phone: nullableText,
  validFrom: optionalDate,
  validUntil: optionalDate,
  notes: nullableText,
});

export const updateOfficeBodySchema = dateRange({
  officeCode: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  officeType: z
    .enum(['HEADQUARTERS', 'BRANCH', 'OPERATING_OFFICE', 'TRAINING_SITE', 'OTHER'])
    .optional(),
  street: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  commune: z.string().trim().min(1).optional(),
  region: z.string().trim().min(1).optional(),
  country: z.string().length(2).optional(),
  postalCode: nullableText,
  email: z.string().email().nullable().optional(),
  phone: nullableText,
  validFrom: optionalDate,
  validUntil: optionalDate,
  notes: nullableText,
});

export const transitionBodySchema = z
  .object({ reason: z.string().trim().min(1).max(500).optional() })
  .strict();

export const listComplianceQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: z
      .enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED', 'SUPERSEDED', 'EXPIRED'])
      .optional(),
    type: z.string().trim().min(1).optional(),
    validAt: isoDate.optional(),
    validUntilFrom: isoDate.optional(),
    validUntilBefore: isoDate.optional(),
    expiringWithinDays: z.coerce.number().int().min(0).max(365).optional(),
  })
  .strict();

export const profileIdQuerySchema = z
  .object({ otecProfileId: uuid, evaluationDate: isoDate.optional() })
  .strict();

export const createProfileBodySchema = z
  .object({
    registrationCode: nullableText,
    rudoReference: nullableText,
    technicalContactName: nullableText,
    technicalContactEmail: z.string().email().nullable().optional(),
    technicalContactPhone: nullableText,
    notes: nullableText,
  })
  .strict();

export const updateProfileBodySchema = createProfileBodySchema;

export const createAccreditationBodySchema = dateRange({
  otecProfileId: uuid,
  accreditationType: z.string().trim().min(1),
  accreditationNumber: z.string().trim().min(1),
  issuedAt: optionalDate,
  validFrom: optionalDate,
  validUntil: optionalDate,
  issuingAuthority: nullableText,
  source: nullableText,
  externalReference: nullableText,
  notes: nullableText,
});

export const updateAccreditationBodySchema = dateRange({
  accreditationType: z.string().trim().min(1).optional(),
  accreditationNumber: z.string().trim().min(1).optional(),
  issuedAt: optionalDate,
  validFrom: optionalDate,
  validUntil: optionalDate,
  issuingAuthority: nullableText,
  source: nullableText,
  externalReference: nullableText,
  notes: nullableText,
});

export const createCertificationBodySchema = dateRange({
  otecProfileId: uuid,
  certificationType: z.enum(['NCH_2728', 'ISO_9001', 'OTHER']),
  certificationNumber: z.string().trim().min(1),
  certifyingEntity: z.string().trim().min(1),
  scope: nullableText,
  issuedAt: optionalDate,
  validFrom: optionalDate,
  validUntil: optionalDate,
  documentId: uuid.nullable().optional(),
  notes: nullableText,
});

export const updateCertificationBodySchema = dateRange({
  certificationType: z.enum(['NCH_2728', 'ISO_9001', 'OTHER']).optional(),
  certificationNumber: z.string().trim().min(1).optional(),
  certifyingEntity: z.string().trim().min(1).optional(),
  scope: nullableText,
  issuedAt: optionalDate,
  validFrom: optionalDate,
  validUntil: optionalDate,
  documentId: uuid.nullable().optional(),
  notes: nullableText,
});

export const createRepresentativeBodySchema = dateRange({
  otecProfileId: uuid,
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  taxId: z.string().trim().min(1),
  email: z.string().email().nullable().optional(),
  phone: nullableText,
  roleTitle: z.string().trim().min(1),
  validFrom: optionalDate,
  validUntil: optionalDate,
  appointmentDocumentId: uuid.nullable().optional(),
  notes: nullableText,
});

export const updateRepresentativeBodySchema = dateRange({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  taxId: z.string().trim().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: nullableText,
  roleTitle: z.string().trim().min(1).optional(),
  validFrom: optionalDate,
  validUntil: optionalDate,
  appointmentDocumentId: uuid.nullable().optional(),
  notes: nullableText,
});

const resolutionType = z.enum([
  'ACCREDITATION',
  'AUTHORIZATION',
  'MODIFICATION',
  'SUSPENSION',
  'CESSATION',
  'OTHER',
]);

export const createResolutionBodySchema = dateRange({
  otecProfileId: uuid,
  resolutionType,
  resolutionNumber: z.string().trim().min(1),
  issuingAuthority: z.string().trim().min(1),
  issuedAt: isoDate,
  validFrom: optionalDate,
  validUntil: optionalDate,
  scope: nullableText,
  documentId: uuid.nullable().optional(),
  notes: nullableText,
});

export const updateResolutionBodySchema = dateRange({
  resolutionType: resolutionType.optional(),
  resolutionNumber: z.string().trim().min(1).optional(),
  issuingAuthority: z.string().trim().min(1).optional(),
  issuedAt: isoDate.optional(),
  validFrom: optionalDate,
  validUntil: optionalDate,
  scope: nullableText,
  documentId: uuid.nullable().optional(),
  notes: nullableText,
});

export const idParamsSchema = z.object({ id: uuid }).strict();

export const readinessBodySchema = z
  .object({ otecProfileId: uuid, evaluationDate: isoDate.optional() })
  .strict();

export const expiringItemsQuerySchema = z
  .object({
    otecProfileId: uuid,
    evaluationDate: isoDate.optional(),
    expiringWithinDays: z.coerce.number().int().min(0).max(365).optional(),
    states: z
      .string()
      .transform((value) => value.split(','))
      .pipe(z.array(z.enum(['EXPIRED', 'EXPIRING_SOON', 'UNDATED', 'SUSPENDED', 'REVOKED'])))
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

const listQuery = (status: z.ZodType, type?: z.ZodType) =>
  z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      status: status.optional(),
      ...(type ? { type: type.optional() } : {}),
      otecProfileId: uuid.optional(),
      validAt: isoDate.optional(),
      validFromAfter: isoDate.optional(),
      validUntilFrom: isoDate.optional(),
      validUntilBefore: isoDate.optional(),
    })
    .strict();

export const accreditationListQuerySchema = listQuery(
  z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'CANCELLED']),
);
export const certificationListQuerySchema = listQuery(
  z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED', 'CANCELLED']),
  z.enum(['NCH_2728', 'ISO_9001', 'OTHER']),
);
export const officeListQuerySchema = listQuery(
  z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED']),
  z.enum(['HEADQUARTERS', 'BRANCH', 'OPERATING_OFFICE', 'TRAINING_SITE', 'OTHER']),
);
export const representativeListQuerySchema = listQuery(z.enum(['ACTIVE', 'INACTIVE']));
export const resolutionListQuerySchema = listQuery(
  z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED', 'SUPERSEDED']),
  resolutionType,
);

export const supersessionBodySchema = z
  .object({
    replacementResolutionId: uuid,
    replacementIfMatch: z.string().regex(/^W\/"v[1-9]\d*"$/),
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();
