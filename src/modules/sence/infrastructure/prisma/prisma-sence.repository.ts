import {
  Prisma,
  type PrismaClient,
  type SenceDeclaration as PrismaSenceDeclaration,
  type SenceDeclarationStatus as PrismaSenceDeclarationStatus,
  type SenceDocument as PrismaSenceDocument,
} from '@prisma/client';

import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import {
  SenceDeclaration,
  type SenceDeclarationStatus,
} from '../../domain/entities/sence-declaration.entity.js';
import { SenceDocument } from '../../domain/entities/sence-document.entity.js';
import type {
  SenceComplianceSnapshot,
  SenceRepository,
  SenceSearchFilters,
} from '../../domain/repositories/sence.repository.js';

export class PrismaSenceRepository implements SenceRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findById(id: string, organizationId: string): Promise<SenceDeclaration | null> {
    const record = await this.prisma.senceDeclaration.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return record ? this.toDeclarationDomain(record) : null;
  }

  async findByTrainingSession(
    organizationId: string,
    trainingSessionId: string,
  ): Promise<SenceDeclaration | null> {
    const record = await this.prisma.senceDeclaration.findUnique({
      where: { organizationId_trainingSessionId: { organizationId, trainingSessionId } },
    });
    return record && !record.deletedAt ? this.toDeclarationDomain(record) : null;
  }

  async search(
    filters: SenceSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<SenceDeclaration>> {
    const where: Prisma.SenceDeclarationWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.trainingSessionId ? { trainingSessionId: filters.trainingSessionId } : {}),
      ...(filters.status ? { status: toPrismaStatus(filters.status) } : {}),
      ...(filters.courseId
        ? { trainingSession: { courseId: filters.courseId, organizationId: filters.organizationId } }
        : {}),
    };
    const [records, total] = await Promise.all([
      this.prisma.senceDeclaration.findMany({
        where,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.senceDeclaration.count({ where }),
    ]);

    return {
      data: records.map((record) => this.toDeclarationDomain(record)),
      meta: createPaginationMeta(pagination, total),
    };
  }

  async save(declaration: SenceDeclaration): Promise<void> {
    const props = declaration.toPrimitives();
    await this.prisma.senceDeclaration.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        trainingSessionId: props.trainingSessionId,
        senceCode: props.senceCode,
        status: toPrismaStatus(props.status),
        declaredAmount: props.declaredAmount === null ? null : new Prisma.Decimal(props.declaredAmount),
        taxCreditAmount:
          props.taxCreditAmount === null ? null : new Prisma.Decimal(props.taxCreditAmount),
        externalCode: props.externalCode,
        submittedAt: props.submittedAt,
        responsePayload: toPrismaJson(props.responsePayload),
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async update(declaration: SenceDeclaration): Promise<void> {
    const props = declaration.toPrimitives();
    await this.prisma.senceDeclaration.update({
      where: { id_organizationId: { id: props.id, organizationId: props.organizationId } },
      data: {
        senceCode: props.senceCode,
        status: toPrismaStatus(props.status),
        declaredAmount: props.declaredAmount === null ? null : new Prisma.Decimal(props.declaredAmount),
        taxCreditAmount:
          props.taxCreditAmount === null ? null : new Prisma.Decimal(props.taxCreditAmount),
        externalCode: props.externalCode,
        submittedAt: props.submittedAt,
        responsePayload: toPrismaJson(props.responsePayload),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async attachDocument(document: SenceDocument): Promise<void> {
    const props = document.toPrimitives();
    await this.prisma.senceDocument.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        senceDeclarationId: props.senceDeclarationId,
        documentId: props.documentId,
        documentType: props.documentType,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async listDocuments(organizationId: string, declarationId: string): Promise<SenceDocument[]> {
    const records = await this.prisma.senceDocument.findMany({
      where: { organizationId, senceDeclarationId: declarationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => this.toDocumentDomain(record));
  }

  async documentExists(organizationId: string, documentId: string): Promise<boolean> {
    const count = await this.prisma.document.count({
      where: { id: documentId, organizationId, deletedAt: null },
    });
    return count > 0;
  }

  async getComplianceSnapshot(
    organizationId: string,
    declarationId: string,
  ): Promise<SenceComplianceSnapshot | null> {
    const declaration = await this.findById(declarationId, organizationId);
    if (!declaration) {
      return null;
    }
    const declarationProps = declaration.toPrimitives();
    const trainingSession = await this.prisma.trainingSession.findFirst({
      where: {
        id: declarationProps.trainingSessionId,
        organizationId,
        deletedAt: null,
      },
      include: {
        course: true,
        enrollments: {
          where: { organizationId, deletedAt: null },
          include: {
            attendanceRecords: { where: { organizationId, deletedAt: null }, take: 1 },
            certificates: { where: { organizationId, deletedAt: null, status: 'ISSUED' }, take: 1 },
            evaluationResponses: { where: { organizationId, deletedAt: null }, take: 1 },
          },
        },
      },
    });
    const documents = await this.listDocuments(organizationId, declarationId);

    return {
      declaration,
      trainingSession: trainingSession
        ? {
            id: trainingSession.id,
            organizationId: trainingSession.organizationId,
            courseId: trainingSession.courseId,
            instructorId: trainingSession.instructorId,
            providerId: trainingSession.providerId,
            name: trainingSession.name,
            startDate: trainingSession.startDate,
            endDate: trainingSession.endDate,
            status: trainingSession.status,
          }
        : null,
      course: trainingSession
        ? {
            id: trainingSession.course.id,
            organizationId: trainingSession.course.organizationId,
            code: trainingSession.course.code,
            name: trainingSession.course.name,
            modality: trainingSession.course.modality,
            durationHours: Number(trainingSession.course.durationHours),
            status: trainingSession.course.status,
            senceCode: trainingSession.course.senceCode,
          }
        : null,
      participants:
        trainingSession?.enrollments.map((enrollment) => {
          const attendance = enrollment.attendanceRecords[0] ?? null;
          return {
            enrollmentId: enrollment.id,
            employeeId: enrollment.employeeId,
            enrollmentStatus: enrollment.status,
            attendancePercentage:
              attendance === null
                ? null
                : calculateAttendancePercentage(
                    attendance.checkInAt,
                    attendance.checkOutAt,
                    trainingSession.startDate,
                    trainingSession.endDate,
                  ),
            hasAttendance: attendance !== null,
            hasCertificate: enrollment.certificates.length > 0,
            hasEvaluation: enrollment.evaluationResponses.length > 0,
            evaluationPassed: enrollment.evaluationResponses[0]?.passed ?? null,
            crossTenantIssue: enrollment.organizationId !== organizationId,
          };
        }) ?? [],
      documents,
    };
  }

  private toDeclarationDomain(record: PrismaSenceDeclaration): SenceDeclaration {
    return SenceDeclaration.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      trainingSessionId: record.trainingSessionId,
      senceCode: record.senceCode,
      status: fromPrismaStatus(record.status),
      declaredAmount: record.declaredAmount === null ? null : Number(record.declaredAmount),
      taxCreditAmount: record.taxCreditAmount === null ? null : Number(record.taxCreditAmount),
      externalCode: record.externalCode,
      submittedAt: record.submittedAt,
      responsePayload: fromPrismaJson(record.responsePayload),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }

  private toDocumentDomain(record: PrismaSenceDocument): SenceDocument {
    return SenceDocument.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      senceDeclarationId: record.senceDeclarationId,
      documentId: record.documentId,
      documentType: record.documentType,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }
}

function toPrismaStatus(status: SenceDeclarationStatus): PrismaSenceDeclarationStatus {
  return status;
}

function fromPrismaStatus(status: PrismaSenceDeclarationStatus): SenceDeclarationStatus {
  return status;
}

function toPrismaJson(value: Record<string, unknown> | null): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

function fromPrismaJson(value: Prisma.JsonValue): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function calculateAttendancePercentage(
  checkInAt: Date | null,
  checkOutAt: Date | null,
  sessionStartDate: Date,
  sessionEndDate: Date,
): number {
  if (!checkInAt || !checkOutAt) {
    return 0;
  }
  const sessionMinutes = Math.max(0, Math.floor((sessionEndDate.getTime() - sessionStartDate.getTime()) / 60000));
  const attendanceMinutes = Math.max(0, Math.floor((checkOutAt.getTime() - checkInAt.getTime()) / 60000));
  return sessionMinutes === 0 ? 0 : Math.min(100, Math.round((attendanceMinutes / sessionMinutes) * 100));
}
