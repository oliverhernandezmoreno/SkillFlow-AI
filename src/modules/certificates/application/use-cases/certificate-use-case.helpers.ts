import { randomUUID } from 'node:crypto';

import type { AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import { Certificate } from '../../domain/entities/certificate.entity.js';
import type { CertificateRepository } from '../../domain/repositories/certificate.repository.js';
import { CertificateEligibilityService } from '../../domain/services/certificate-eligibility.service.js';
import { CertificateNumberGenerator } from '../../domain/services/certificate-number-generator.js';

export function requireOrganizationId(context: UseCaseContext = anonymousUseCaseContext): string {
  if (!context.organizationId) {
    throw new UnauthorizedError('Authentication required');
  }

  return context.organizationId;
}

export async function loadCertificate(input: {
  repository: CertificateRepository;
  certificateId: string;
  organizationId: string;
}): Promise<Certificate> {
  const certificate = await input.repository.findById(input.certificateId, input.organizationId);
  if (!certificate) {
    throw new NotFoundError('Certificate not found');
  }

  return certificate;
}

export async function issueCertificateFromEnrollment(input: {
  repository: CertificateRepository;
  eligibilityService: CertificateEligibilityService;
  numberGenerator: CertificateNumberGenerator;
  enrollmentId: string;
  expiresAt: Date | null;
  organizationId: string;
  context: UseCaseContext;
  auditLogger: AuditLogger;
}): Promise<Certificate> {
  const snapshot = await input.repository.getEligibilitySnapshot(
    input.organizationId,
    input.enrollmentId,
  );
  const eligibility = input.eligibilityService.evaluate(snapshot);
  await input.auditLogger.record({
    organizationId: input.organizationId,
    actorUserId: input.context.actorUserId,
    entityType: 'CERTIFICATE',
    entityId: null,
    action: 'certificate.eligibility.check',
    metadata: { enrollmentId: input.enrollmentId },
    after: eligibility,
    ipAddress: input.context.ipAddress ?? null,
    userAgent: input.context.userAgent ?? null,
  });

  if (!eligibility.eligible) {
    throw new BadRequestError(`Certificate eligibility failed: ${eligibility.reasons.join('; ')}`);
  }
  if (!snapshot.enrollment || !snapshot.trainingSession || !snapshot.course) {
    throw new NotFoundError('Certificate source data not found');
  }

  const issuedYear = new Date().getUTCFullYear();
  const sequence =
    (await input.repository.countIssuedByOrganizationAndYear(input.organizationId, issuedYear)) + 1;
  const certificate = Certificate.issue({
    organizationId: input.organizationId,
    enrollmentId: snapshot.enrollment.id,
    employeeId: snapshot.enrollment.employeeId,
    courseId: snapshot.trainingSession.courseId,
    trainingSessionId: snapshot.enrollment.trainingSessionId,
    certificateNumber: input.numberGenerator.generate({
      organizationId: input.organizationId,
      year: issuedYear,
      sequence,
    }),
    verificationCode: randomUUID(),
    expiresAt: input.expiresAt,
  });

  await input.repository.save(certificate);
  await input.auditLogger.record({
    organizationId: input.organizationId,
    actorUserId: input.context.actorUserId,
    entityType: 'CERTIFICATE',
    entityId: certificate.id,
    action: 'certificate.issue',
    metadata: { enrollmentId: input.enrollmentId },
    after: certificate.toPrimitives(),
    ipAddress: input.context.ipAddress ?? null,
    userAgent: input.context.userAgent ?? null,
  });

  return certificate;
}
