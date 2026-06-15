import {
  type Certificate as PrismaCertificate,
  type CertificateStatus as PrismaCertificateStatus,
  type PrismaClient,
} from '@prisma/client';

import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { Certificate, type CertificateStatus } from '../../domain/entities/certificate.entity.js';
import type {
  CertificateDocumentSnapshot,
  CertificateEligibilitySnapshot,
  CertificateRepository,
  CertificateSearchFilters,
} from '../../domain/repositories/certificate.repository.js';

export class PrismaCertificateRepository implements CertificateRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findById(id: string, organizationId: string): Promise<Certificate | null> {
    const record = await this.prisma.certificate.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    return record ? this.toDomain(record) : null;
  }

  async findByEnrollment(organizationId: string, enrollmentId: string): Promise<Certificate | null> {
    const record = await this.prisma.certificate.findFirst({
      where: { organizationId, enrollmentId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return record ? this.toDomain(record) : null;
  }

  async findByVerificationCode(verificationCode: string): Promise<Certificate | null> {
    const record = await this.prisma.certificate.findUnique({
      where: { verificationCode },
    });

    return record && !record.deletedAt ? this.toDomain(record) : null;
  }

  async search(
    filters: CertificateSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Certificate>> {
    const where = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      ...(filters.enrollmentId ? { enrollmentId: filters.enrollmentId } : {}),
      ...(filters.trainingSessionId ? { trainingSessionId: filters.trainingSessionId } : {}),
      ...(filters.status ? { status: toPrismaStatus(filters.status) } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.certificate.findMany({
        where,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.certificate.count({ where }),
    ]);

    return {
      data: records.map((record) => this.toDomain(record)),
      meta: createPaginationMeta(pagination, total),
    };
  }

  async save(certificate: Certificate): Promise<void> {
    const props = certificate.toPrimitives();
    await this.prisma.certificate.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        enrollmentId: props.enrollmentId,
        employeeId: props.employeeId,
        courseId: props.courseId,
        trainingSessionId: props.trainingSessionId,
        certificateNumber: props.certificateNumber,
        verificationCode: props.verificationCode,
        status: toPrismaStatus(props.status),
        issuedAt: props.issuedAt,
        expiresAt: props.expiresAt,
        revokedAt: props.revokedAt,
        revokedReason: props.revokedReason,
        fileUrl: props.fileUrl,
        documentId: props.documentId,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async update(certificate: Certificate): Promise<void> {
    const props = certificate.toPrimitives();
    await this.prisma.certificate.update({
      where: { id_organizationId: { id: props.id, organizationId: props.organizationId } },
      data: {
        status: toPrismaStatus(props.status),
        expiresAt: props.expiresAt,
        revokedAt: props.revokedAt,
        revokedReason: props.revokedReason,
        fileUrl: props.fileUrl,
        documentId: props.documentId,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async countIssuedByOrganizationAndYear(organizationId: string, year: number): Promise<number> {
    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year + 1, 0, 1));

    return this.prisma.certificate.count({
      where: {
        organizationId,
        issuedAt: { gte: startDate, lt: endDate },
        deletedAt: null,
      },
    });
  }

  async getEligibilitySnapshot(
    organizationId: string,
    enrollmentId: string,
  ): Promise<CertificateEligibilitySnapshot> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, organizationId, deletedAt: null },
      include: {
        employee: true,
        trainingSession: {
          include: {
            course: true,
          },
        },
        attendanceRecords: {
          where: { organizationId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    const evaluations = enrollment
      ? await this.prisma.evaluation.findMany({
          where: {
            organizationId,
            trainingSessionId: enrollment.trainingSessionId,
            deletedAt: null,
          },
          include: {
            responses: {
              where: {
                organizationId,
                employeeId: enrollment.employeeId,
                deletedAt: null,
              },
              take: 1,
            },
          },
        })
      : [];
    const existingCertificate = await this.findByEnrollment(organizationId, enrollmentId);

    return {
      enrollment: enrollment
        ? {
            id: enrollment.id,
            organizationId: enrollment.organizationId,
            trainingSessionId: enrollment.trainingSessionId,
            employeeId: enrollment.employeeId,
            status: enrollment.status,
          }
        : null,
      employee: enrollment
        ? {
            id: enrollment.employee.id,
            organizationId: enrollment.employee.organizationId,
            firstName: enrollment.employee.firstName,
            lastName: enrollment.employee.lastName,
          }
        : null,
      trainingSession: enrollment
        ? {
            id: enrollment.trainingSession.id,
            organizationId: enrollment.trainingSession.organizationId,
            courseId: enrollment.trainingSession.courseId,
            startDate: enrollment.trainingSession.startDate,
            endDate: enrollment.trainingSession.endDate,
          }
        : null,
      course: enrollment
        ? {
            id: enrollment.trainingSession.course.id,
            organizationId: enrollment.trainingSession.course.organizationId,
            code: enrollment.trainingSession.course.code,
            name: enrollment.trainingSession.course.name,
            validityMonths: enrollment.trainingSession.course.validityMonths,
          }
        : null,
      attendance: enrollment?.attendanceRecords[0]
        ? {
            id: enrollment.attendanceRecords[0].id,
            organizationId: enrollment.attendanceRecords[0].organizationId,
            enrollmentId: enrollment.attendanceRecords[0].enrollmentId,
            trainingSessionId: enrollment.attendanceRecords[0].trainingSessionId,
            employeeId: enrollment.attendanceRecords[0].employeeId,
            checkInAt: enrollment.attendanceRecords[0].checkInAt,
            checkOutAt: enrollment.attendanceRecords[0].checkOutAt,
          }
        : null,
      evaluations: evaluations.map((evaluation) => ({
        id: evaluation.id,
        closedAt: evaluation.closedAt,
        response: evaluation.responses[0]
          ? {
              score: evaluation.responses[0].score === null ? null : Number(evaluation.responses[0].score),
              passed: evaluation.responses[0].passed,
            }
          : null,
      })),
      existingCertificate,
    };
  }

  async createDocumentForCertificate(input: {
    organizationId: string;
    certificateId: string;
    fileName: string;
    mimeType: string;
    actorUserId: string | null;
  }): Promise<CertificateDocumentSnapshot> {
    const document = await this.prisma.document.create({
      data: {
        organizationId: input.organizationId,
        type: 'CERTIFICATE',
        entityType: 'CERTIFICATE',
        entityId: input.certificateId,
        fileName: input.fileName,
        fileUrl: null,
        mimeType: input.mimeType,
        storageKey: `local-stub/certificates/${input.certificateId}.pdf`,
        uploadedByUserId: input.actorUserId,
      },
    });

    return {
      id: document.id,
      organizationId: document.organizationId,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      mimeType: document.mimeType,
      storageKey: document.storageKey,
    };
  }

  private toDomain(record: PrismaCertificate): Certificate {
    return Certificate.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      enrollmentId: record.enrollmentId,
      employeeId: record.employeeId,
      courseId: record.courseId,
      trainingSessionId: record.trainingSessionId,
      certificateNumber: record.certificateNumber,
      verificationCode: record.verificationCode,
      status: fromPrismaStatus(record.status),
      issuedAt: record.issuedAt,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
      revokedReason: record.revokedReason,
      fileUrl: record.fileUrl,
      documentId: record.documentId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }
}

function toPrismaStatus(status: CertificateStatus): PrismaCertificateStatus {
  return status;
}

function fromPrismaStatus(status: PrismaCertificateStatus): CertificateStatus {
  return status;
}
