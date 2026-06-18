'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, UserPlus, Users } from 'lucide-react';
import { useMemo } from 'react';

import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { FilterBar } from '@/components/forms/filter-bar';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTable } from '@/components/tables/data-table';
import { EmployeeFormDialog } from '@/features/employees/employee-form-dialog';
import { useCreateEmployee, useEmployees, useUpdateEmployee } from '@/hooks/use-employees';
import { usePersistentFilters } from '@/hooks/use-persistent-filters';
import type { EmployeeFormValues } from '@/lib/validations/resources';
import { useAuthStore } from '@/stores/auth-store';
import type { Employee } from '@/types/resources';

export function EmployeesPageContent() {
  const defaultFilters = useMemo(
    () => ({
      page: 1,
      pageSize: 50,
      search: '',
      status: '',
    }),
    [],
  );
  const [filters, setFilters] = usePersistentFilters('skillflow-filters-employees', defaultFilters);
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const employeesQuery = useEmployees({ ...filters, organizationId });
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const employees = employeesQuery.data?.data ?? [];
  const activeEmployees = employees.filter((employee) => employee.status === 'ACTIVE').length;

  async function create(values: EmployeeFormValues) {
    if (!organizationId) {
      return;
    }

    await createEmployee.mutateAsync({
      organizationId,
      ...values,
      email: values.email || undefined,
    });
  }

  async function update(employeeId: string, values: EmployeeFormValues) {
    await updateEmployee.mutateAsync({
      employeeId,
      input: {
        ...values,
        email: values.email || undefined,
      },
    });
  }

  const columns: Array<ColumnDef<Employee>> = [
    {
      accessorKey: 'firstName',
      header: 'Nombre',
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    { accessorKey: 'areaName', header: 'Area' },
    { accessorKey: 'positionName', header: 'Cargo' },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <EmployeeFormDialog mode="edit" employee={row.original} onSubmit={(values) => update(row.original.id, values)} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colaboradores"
        description="Centraliza perfiles, cargos, áreas y señales de preparación para capacitación."
        action={<EmployeeFormDialog mode="create" onSubmit={create} />}
        icon={Users}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Colaboradores cargados" value={String(employeesQuery.data?.meta.total ?? 0)} change="Desde la API backend" tone="indigo" icon={Users} />
        <StatCard title="Colaboradores activos" value={String(activeEmployees)} change="Registros activos de la página" tone="emerald" icon={BadgeCheck} />
        <StatCard title="Fuente de perfiles" value="Activa" change="Datos del tenant autenticado" tone="cyan" icon={UserPlus} />
      </section>
      <FilterBar
        searchValue={filters.search}
        statusValue={filters.status}
        statusOptions={['ACTIVE', 'INACTIVE', 'TERMINATED']}
        onSearchChange={(search) => setFilters({ search, page: 1 })}
        onStatusChange={(status) => setFilters({ status, page: 1 })}
      />
      <SectionCard title="Vista de colaboradores" description="Registros en vivo desde el backend de SkillFlow.">
        {employeesQuery.isLoading ? <LoadingSkeleton /> : null}
        {employeesQuery.isError ? <ErrorState onAction={() => void employeesQuery.refetch()} /> : null}
        {!employeesQuery.isLoading && !employeesQuery.isError && employees.length > 0 ? (
          <DataTable columns={columns} data={employees} />
        ) : null}
        {!employeesQuery.isLoading && !employeesQuery.isError && employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No se encontraron colaboradores"
            description="Crea perfiles de colaboradores para iniciar inscripciones en rutas de capacitación."
            actionLabel="Agregar colaborador"
          />
        ) : null}
      </SectionCard>
    </div>
  );
}
