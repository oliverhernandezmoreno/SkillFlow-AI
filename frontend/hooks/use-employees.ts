import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/query-keys';
import { createEmployee, listEmployees, updateEmployee } from '@/features/employees/services';
import type { EmployeeInput, ListFilters } from '@/types/resources';

export function useEmployees(filters: ListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.employees.list(filters),
    queryFn: () => listEmployees(filters),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() }),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, input }: { employeeId: string; input: Partial<EmployeeInput> }) =>
      updateEmployee(employeeId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() }),
  });
}
