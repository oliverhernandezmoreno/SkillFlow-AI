import { apiRequest } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-params';
import type { Employee, EmployeeInput, ListFilters, PaginatedResponse } from '@/types/resources';

export function listEmployees(filters: ListFilters = {}) {
  return apiRequest<PaginatedResponse<Employee>>(`/employees${toQueryString(filters)}`);
}

export function createEmployee(input: EmployeeInput) {
  return apiRequest<Employee>('/employees', {
    method: 'POST',
    body: input,
  });
}

export function updateEmployee(employeeId: string, input: Partial<EmployeeInput>) {
  return apiRequest<Employee>(`/employees/${employeeId}`, {
    method: 'PATCH',
    body: input,
  });
}
