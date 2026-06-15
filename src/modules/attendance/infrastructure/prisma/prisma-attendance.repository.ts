import {
  Prisma,
  type AttendanceMethod as PrismaAttendanceMethod,
  type AttendanceRecord as PrismaAttendanceRecord,
  type AttendanceStatus as PrismaAttendanceStatus,
  type PrismaClient,
} from '@prisma/client';

import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import {
  AttendanceRecord,
  type AttendanceMethod,
  type AttendanceStatus,
} from '../../domain/entities/attendance-record.entity.js';
import type {
  AttendanceRepository,
  AttendanceSearchFilters,
} from '../../domain/repositories/attendance.repository.js';

export class PrismaAttendanceRepository implements AttendanceRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findById(id: string, organizationId: string): Promise<AttendanceRecord | null> {
    const record = await this.prisma.attendanceRecord.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    return record ? this.toDomain(record) : null;
  }

  async findByEnrollment(
    organizationId: string,
    enrollmentId: string,
  ): Promise<AttendanceRecord | null> {
    const record = await this.prisma.attendanceRecord.findFirst({
      where: { organizationId, enrollmentId, deletedAt: null },
    });

    return record ? this.toDomain(record) : null;
  }

  async search(
    filters: AttendanceSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<AttendanceRecord>> {
    const where: Prisma.AttendanceRecordWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
    };
    if (filters.enrollmentId) {
      where.enrollmentId = filters.enrollmentId;
    }
    if (filters.trainingSessionId) {
      where.trainingSessionId = filters.trainingSessionId;
    }
    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }
    if (filters.status) {
      where.status = toPrismaStatus(filters.status);
    }

    const [records, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return {
      data: records.map((record) => this.toDomain(record)),
      meta: createPaginationMeta(pagination, total),
    };
  }

  async save(attendanceRecord: AttendanceRecord): Promise<void> {
    const props = attendanceRecord.toPrimitives();
    await this.prisma.attendanceRecord.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        enrollmentId: props.enrollmentId,
        trainingSessionId: props.trainingSessionId,
        employeeId: props.employeeId,
        method: toPrismaMethod(props.method),
        status: toPrismaStatus(props.status),
        checkInAt: props.checkInAt,
        checkOutAt: props.checkOutAt,
        evidenceDocumentId: props.evidenceDocumentId,
        qrToken: props.qrToken,
        signatureStorageKey: props.signatureStorageKey,
        latitude: props.latitude === null ? null : new Prisma.Decimal(props.latitude),
        longitude: props.longitude === null ? null : new Prisma.Decimal(props.longitude),
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async update(attendanceRecord: AttendanceRecord): Promise<void> {
    const props = attendanceRecord.toPrimitives();
    await this.prisma.attendanceRecord.update({
      where: { id_organizationId: { id: props.id, organizationId: props.organizationId } },
      data: {
        method: toPrismaMethod(props.method),
        status: toPrismaStatus(props.status),
        checkInAt: props.checkInAt,
        checkOutAt: props.checkOutAt,
        evidenceDocumentId: props.evidenceDocumentId,
        qrToken: props.qrToken,
        signatureStorageKey: props.signatureStorageKey,
        latitude: props.latitude === null ? null : new Prisma.Decimal(props.latitude),
        longitude: props.longitude === null ? null : new Prisma.Decimal(props.longitude),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  private toDomain(record: PrismaAttendanceRecord): AttendanceRecord {
    return AttendanceRecord.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      enrollmentId: record.enrollmentId,
      trainingSessionId: record.trainingSessionId,
      employeeId: record.employeeId,
      method: fromPrismaMethod(record.method),
      status: fromPrismaStatus(record.status),
      checkInAt: record.checkInAt,
      checkOutAt: record.checkOutAt,
      evidenceDocumentId: record.evidenceDocumentId,
      qrToken: record.qrToken,
      signatureStorageKey: record.signatureStorageKey,
      latitude: record.latitude === null ? null : Number(record.latitude),
      longitude: record.longitude === null ? null : Number(record.longitude),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }
}

function toPrismaMethod(method: AttendanceMethod): PrismaAttendanceMethod {
  return method;
}

function fromPrismaMethod(method: PrismaAttendanceMethod): AttendanceMethod {
  return method;
}

function toPrismaStatus(status: AttendanceStatus): PrismaAttendanceStatus {
  return status;
}

function fromPrismaStatus(status: PrismaAttendanceStatus): AttendanceStatus {
  return status;
}
