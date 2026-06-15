import { describe, expect, it } from 'vitest';

import type { PaginatedResult, PaginationInput } from '../../shared/application/pagination.js';
import { BadRequestError } from '../../shared/domain/errors.js';
import { CheckCertificateEligibilityUseCase } from './application/use-cases/check-certificate-eligibility.use-case.js';
import { GenerateCertificateDocumentUseCase } from './application/use-cases/generate-certificate-document.use-case.js';
import { IssueCertificateUseCase } from './application/use-cases/issue-certificate.use-case.js';
import { RevokeCertificateUseCase } from './application/use-cases/revoke-certificate.use-case.js';
import { VerifyCertificateUseCase } from './application/use-cases/verify-certificate.use-case.js';
import { Certificate } from './domain/entities/certificate.entity.js';
import type {
  CertificateDocumentSnapshot,
  CertificateEligibilitySnapshot,
  CertificateRepository,
  CertificateSearchFilters,
} from './domain/repositories/certificate.repository.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const otherOrganizationId = '22222222-2222-4222-8222-222222222222';
const enrollmentId = '33333333-3333-4333-8333-333333333333';
const employeeId = '44444444-4444-4444-8444-444444444444';
const trainingSessionId = '55555555-5555-4555-8555-555555555555';
const courseId = '66666666-6666-4666-8666-666666666666';
const now = new Date('2026-06-15T12:00:00.000Z');
const context = {
  organizationId,
  actorUserId: '77777777-7777-4777-8777-777777777777',
};

class FakeCertificateRepository implements CertificateRepository {
  certificates: Certificate[] = [];
  documents: CertificateDocumentSnapshot[] = [];
  snapshot: CertificateEligibilitySnapshot = createEligibleSnapshot();

  async findById(id: string, inputOrganizationId: string): Promise<Certificate | null> {
    return (
      this.certificates.find((certificate) => {
        const props = certificate.toPrimitives();
        return certificate.id === id && props.organizationId === inputOrganizationId && !props.deletedAt;
      }) ?? null
    );
  }

  async findByEnrollment(
    inputOrganizationId: string,
    inputEnrollmentId: string,
  ): Promise<Certificate | null> {
    return (
      this.certificates.find((certificate) => {
        const props = certificate.toPrimitives();
        return (
          props.organizationId === inputOrganizationId &&
          props.enrollmentId === inputEnrollmentId &&
          !props.deletedAt
        );
      }) ?? null
    );
  }

  async findByVerificationCode(verificationCode: string): Promise<Certificate | null> {
    return (
      this.certificates.find((certificate) => {
        const props = certificate.toPrimitives();
        return props.verificationCode === verificationCode && !props.deletedAt;
      }) ?? null
    );
  }

  async search(
    filters: CertificateSearchFilters,
    _pagination: PaginationInput,
  ): Promise<PaginatedResult<Certificate>> {
    const data = this.certificates.filter((certificate) => {
      const props = certificate.toPrimitives();
      return (
        props.organizationId === filters.organizationId &&
        !props.deletedAt &&
        (filters.employeeId === undefined || props.employeeId === filters.employeeId) &&
        (filters.enrollmentId === undefined || props.enrollmentId === filters.enrollmentId) &&
        (filters.trainingSessionId === undefined ||
          props.trainingSessionId === filters.trainingSessionId) &&
        (filters.status === undefined || props.status === filters.status)
      );
    });

    return { data, meta: { page: 1, pageSize: 20, total: data.length, totalPages: 1 } };
  }

  async save(certificate: Certificate): Promise<void> {
    this.certificates.push(certificate);
  }

  async update(certificate: Certificate): Promise<void> {
    this.certificates = this.certificates.map((current) =>
      current.id === certificate.id ? certificate : current,
    );
  }

  async countIssuedByOrganizationAndYear(): Promise<number> {
    return this.certificates.length;
  }

  async getEligibilitySnapshot(
    inputOrganizationId: string,
    inputEnrollmentId: string,
  ): Promise<CertificateEligibilitySnapshot> {
    if (inputOrganizationId !== organizationId || inputEnrollmentId !== enrollmentId) {
      return {
        ...createEligibleSnapshot(),
        enrollment: null,
        employee: null,
        trainingSession: null,
        course: null,
        attendance: null,
        evaluations: [],
        existingCertificate: null,
      };
    }

    return {
      ...this.snapshot,
      existingCertificate: await this.findByEnrollment(inputOrganizationId, inputEnrollmentId),
    };
  }

  async createDocumentForCertificate(input: {
    organizationId: string;
    certificateId: string;
    fileName: string;
    mimeType: string;
    actorUserId: string | null;
  }): Promise<CertificateDocumentSnapshot> {
    const document = {
      id: '88888888-8888-4888-8888-888888888888',
      organizationId: input.organizationId,
      fileName: input.fileName,
      fileUrl: null,
      mimeType: input.mimeType,
      storageKey: `local-stub/certificates/${input.certificateId}.pdf`,
    };
    this.documents.push(document);

    return document;
  }
}

describe('Certificates module', () => {
  it('returns eligible when attendance is sufficient', async () => {
    const repository = new FakeCertificateRepository();
    const result = await new CheckCertificateEligibilityUseCase(repository).execute(
      { enrollmentId },
      context,
    );

    expect(result.eligible).toBe(true);
    expect(result.attendancePercentage).toBe(100);
  });

  it('fails eligibility when attendance is missing', async () => {
    const repository = new FakeCertificateRepository();
    repository.snapshot = { ...repository.snapshot, attendance: null };
    const result = await new CheckCertificateEligibilityUseCase(repository).execute(
      { enrollmentId },
      context,
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('Attendance record not found');
  });

  it('fails eligibility when attendance is insufficient', async () => {
    const repository = new FakeCertificateRepository();
    const attendance = repository.snapshot.attendance;
    if (!attendance) {
      throw new Error('Test fixture attendance is required');
    }
    repository.snapshot = {
      ...repository.snapshot,
      attendance: {
        ...attendance,
        checkInAt: new Date('2026-06-15T09:00:00.000Z'),
        checkOutAt: new Date('2026-06-15T10:00:00.000Z'),
      },
    };
    const result = await new CheckCertificateEligibilityUseCase(repository).execute(
      { enrollmentId },
      context,
    );

    expect(result.eligible).toBe(false);
    expect(result.attendancePercentage).toBe(25);
  });

  it('fails eligibility when required evaluation is not passed', async () => {
    const repository = new FakeCertificateRepository();
    repository.snapshot = {
      ...repository.snapshot,
      evaluations: [
        {
          id: '99999999-9999-4999-8999-999999999999',
          closedAt: now,
          response: { score: 60, passed: false },
        },
      ],
    };
    const result = await new CheckCertificateEligibilityUseCase(repository).execute(
      { enrollmentId },
      context,
    );

    expect(result.eligible).toBe(false);
    expect(result.evaluationRequired).toBe(true);
  });

  it('issues a certificate when eligibility passes', async () => {
    const repository = new FakeCertificateRepository();
    const result = await new IssueCertificateUseCase(repository).execute({ enrollmentId }, context);

    expect(result.status).toBe('ISSUED');
    expect(result.certificateNumber).toMatch(/^CERT-\d{4}-[A-F0-9]{6}-000001$/u);
    expect(repository.certificates).toHaveLength(1);
  });

  it('fails duplicate certificate issue for the same enrollment', async () => {
    const repository = new FakeCertificateRepository();
    await new IssueCertificateUseCase(repository).execute({ enrollmentId }, context);

    await expect(
      new IssueCertificateUseCase(repository).execute({ enrollmentId }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('revokes a certificate without deleting it', async () => {
    const repository = new FakeCertificateRepository();
    const issued = await new IssueCertificateUseCase(repository).execute({ enrollmentId }, context);
    const revoked = await new RevokeCertificateUseCase(repository).execute(
      issued.id,
      { reason: 'Administrative correction' },
      context,
    );
    const stored = await repository.findById(issued.id, organizationId);

    expect(revoked.status).toBe('REVOKED');
    expect(stored?.toPrimitives().deletedAt).toBeNull();
  });

  it('marks revoked certificates as invalid during public verification', async () => {
    const repository = new FakeCertificateRepository();
    const issued = await new IssueCertificateUseCase(repository).execute({ enrollmentId }, context);
    await new RevokeCertificateUseCase(repository).execute(
      issued.id,
      { reason: 'Administrative correction' },
      context,
    );
    const result = await new VerifyCertificateUseCase(repository).execute({
      verificationCode: issued.verificationCode,
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe('REVOKED');
  });

  it('verifies issued certificates publicly', async () => {
    const repository = new FakeCertificateRepository();
    const issued = await new IssueCertificateUseCase(repository).execute({ enrollmentId }, context);
    const result = await new VerifyCertificateUseCase(repository).execute({
      verificationCode: issued.verificationCode,
    });

    expect(result.valid).toBe(true);
    expect(result.certificateNumber).toBe(issued.certificateNumber);
  });

  it('does not expose sensitive PII during public verification', async () => {
    const repository = new FakeCertificateRepository();
    const issued = await new IssueCertificateUseCase(repository).execute({ enrollmentId }, context);
    const result = await new VerifyCertificateUseCase(repository).execute({
      verificationCode: issued.verificationCode,
    });

    expect(result).not.toHaveProperty('employeeId');
    expect(result).not.toHaveProperty('employeeName');
  });

  it('fails cross-tenant eligibility', async () => {
    const repository = new FakeCertificateRepository();
    const result = await new CheckCertificateEligibilityUseCase(repository).execute(
      { enrollmentId },
      { ...context, organizationId: otherOrganizationId },
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('Enrollment not found');
  });

  it('generates certificate document metadata', async () => {
    const repository = new FakeCertificateRepository();
    const issued = await new IssueCertificateUseCase(repository).execute({ enrollmentId }, context);
    const document = await new GenerateCertificateDocumentUseCase(repository).execute(
      issued.id,
      context,
    );

    expect(document.status).toBe('GENERATED');
    expect(document.mimeType).toBe('application/pdf');
    expect(document.storageKey).toContain('local-stub/certificates');
  });
});

function createEligibleSnapshot(): CertificateEligibilitySnapshot {
  return {
    enrollment: {
      id: enrollmentId,
      organizationId,
      trainingSessionId,
      employeeId,
      status: 'COMPLETED',
    },
    employee: {
      id: employeeId,
      organizationId,
      firstName: 'Ada',
      lastName: 'Lovelace',
    },
    trainingSession: {
      id: trainingSessionId,
      organizationId,
      courseId,
      startDate: new Date('2026-06-15T09:00:00.000Z'),
      endDate: new Date('2026-06-15T13:00:00.000Z'),
    },
    course: {
      id: courseId,
      organizationId,
      code: 'SAFE-101',
      name: 'Safety Basics',
      validityMonths: 12,
    },
    attendance: {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      organizationId,
      enrollmentId,
      trainingSessionId,
      employeeId,
      checkInAt: new Date('2026-06-15T09:00:00.000Z'),
      checkOutAt: new Date('2026-06-15T13:00:00.000Z'),
    },
    evaluations: [],
    existingCertificate: null,
  };
}
