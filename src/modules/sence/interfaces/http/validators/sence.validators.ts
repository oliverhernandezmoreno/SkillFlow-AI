import { z } from 'zod';

export const createSenceDeclarationSchema = z.object({
  trainingSessionId: z.string().uuid(),
  senceCode: z.string().trim().min(1).nullable().optional(),
  declaredAmount: z.number().nonnegative().nullable().optional(),
  taxCreditAmount: z.number().nonnegative().nullable().optional(),
  externalCode: z.string().trim().min(1).nullable().optional(),
});

export const updateSenceDeclarationSchema = z.object({
  senceCode: z.string().trim().min(1).nullable().optional(),
  declaredAmount: z.number().nonnegative().nullable().optional(),
  taxCreditAmount: z.number().nonnegative().nullable().optional(),
  externalCode: z.string().trim().min(1).nullable().optional(),
});

export const submitSenceDeclarationSchema = z.object({
  comments: z.string().trim().min(1).max(1000).nullable().optional(),
});

export const updateSenceStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'OBSERVED']),
  reason: z.string().trim().min(1).max(1000).nullable().optional(),
  comments: z.string().trim().min(1).max(1000).nullable().optional(),
});

export const attachSenceDocumentSchema = z.object({
  documentId: z.string().uuid(),
  documentType: z.string().trim().min(1).max(100).nullable().optional(),
});
