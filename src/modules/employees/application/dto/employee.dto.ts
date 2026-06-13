import type { EmployeeStatus } from '../../domain/entities/employee.entity.js';

export interface EmployeeDto {
  id: string;
  organizationId: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  positionName: string;
  areaName: string;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDto {
  organizationId: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email?: string | undefined;
  positionName?: string | undefined;
  areaName?: string | undefined;
}

export type UpdateEmployeeDto = Partial<CreateEmployeeDto> & { status?: EmployeeStatus | undefined };
