import type { Employee as PrismaEmployee, Prisma, PrismaClient } from '@prisma/client';

import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { Employee } from '../../domain/entities/employee.entity.js';
import type {
  EmployeeRepository,
  EmployeeSearchFilters,
} from '../../domain/repositories/employee.repository.js';

export class PrismaEmployeeRepository implements EmployeeRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findById(id: string): Promise<Employee | null> {
    const record = await this.prisma.employee.findFirst({ where: { id, deletedAt: null } });
    return record ? this.toDomain(record) : null;
  }

  async findByRut(organizationId: string, rut: string): Promise<Employee | null> {
    const record = await this.prisma.employee.findUnique({
      where: { organizationId_rut: { organizationId, rut } },
    });
    return record ? this.toDomain(record) : null;
  }

  async search(
    filters: EmployeeSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Employee>> {
    const where: Prisma.EmployeeWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.search
        ? {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
              { rut: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [records, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: records.map((record) => this.toDomain(record)),
      meta: createPaginationMeta(pagination, total),
    };
  }

  async save(employee: Employee): Promise<void> {
    await this.prisma.employee.create({ data: employee.toPrimitives() });
  }

  async update(employee: Employee): Promise<void> {
    const props = employee.toPrimitives();
    await this.prisma.employee.update({ where: { id: props.id }, data: props });
  }

  private toDomain(record: PrismaEmployee): Employee {
    return Employee.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      rut: record.rut,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      position: record.position ?? 'Unassigned',
      department: record.department ?? 'Unassigned',
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }
}
