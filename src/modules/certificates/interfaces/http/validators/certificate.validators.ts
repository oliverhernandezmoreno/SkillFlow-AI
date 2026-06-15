import { z } from 'zod';

export const issueCertificateSchema = z.object({
  enrollmentId: z.string().uuid(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const certificateEligibilitySchema = z.object({
  enrollmentId: z.string().uuid(),
});

export const revokeCertificateSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});
