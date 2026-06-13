import type { PaginatedResult, PaginationInput } from '../../../../shared/application/pagination.js';
import type { Employee } from '../entities/employee.entity.js';

export interface EmployeeSearchFilters {
  organizationId: string;
  search?: string | undefined;
}

export interface EmployeeRepository {
  findById(id: string): Promise<Employee | null>;
  findByRut(organizationId: string, rut: string): Promise<Employee | null>;
  search(filters: EmployeeSearchFilters, pagination: PaginationInput): Promise<PaginatedResult<Employee>>;
  save(employee: Employee): Promise<void>;
  update(employee: Employee): Promise<void>;
}
