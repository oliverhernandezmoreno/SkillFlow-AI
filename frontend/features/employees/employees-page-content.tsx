'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';

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
import type { EmployeeFormValues } from '@/lib/validations/resources';
import { useAuthStore } from '@/stores/auth-store';
import type { Employee } from '@/types/resources';

export function EmployeesPageContent() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const employeesQuery = useEmployees({ page: 1, pageSize: 50, search, status, organizationId });
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
      header: 'Name',
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    { accessorKey: 'areaName', header: 'Area' },
    { accessorKey: 'positionName', header: 'Position' },
    {
      accessorKey: 'status',
      header: 'Status',
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
        title="Employees"
        description="Centralize workforce profiles, roles, areas and training readiness signals."
        action={<EmployeeFormDialog mode="create" onSubmit={create} />}
        icon={Users}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Loaded employees" value={String(employeesQuery.data?.meta.total ?? 0)} change="From backend API" tone="indigo" icon={Users} />
        <StatCard title="Active employees" value={String(activeEmployees)} change="Current page active records" tone="emerald" icon={BadgeCheck} />
        <StatCard title="Profile source" value="Live" change="Authenticated tenant data" tone="cyan" icon={UserPlus} />
      </section>
      <FilterBar
        searchValue={search}
        statusValue={status}
        statusOptions={['ACTIVE', 'INACTIVE', 'TERMINATED']}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />
      <SectionCard title="Employees overview" description="Live employee records from the SkillFlow backend.">
        {employeesQuery.isLoading ? <LoadingSkeleton /> : null}
        {employeesQuery.isError ? <ErrorState onAction={() => void employeesQuery.refetch()} /> : null}
        {!employeesQuery.isLoading && !employeesQuery.isError && employees.length > 0 ? (
          <DataTable columns={columns} data={employees} />
        ) : null}
        {!employeesQuery.isLoading && !employeesQuery.isError && employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees found"
            description="Create employee profiles to start enrolling participants in training paths."
            actionLabel="Add employee"
          />
        ) : null}
      </SectionCard>
    </div>
  );
}
