'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ListChecks, UserCheck, UserRoundCheck, UsersRound } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { useApiErrorToast } from '@/hooks/use-api-error-toast';
import { EnrollmentFormDialog } from '@/features/enrollments/enrollment-form-dialog';
import { useEmployees } from '@/hooks/use-employees';
import { useCancelEnrollment, useCreateEnrollment, useEnrollments } from '@/hooks/use-enrollments';
import { usePersistentFilters } from '@/hooks/use-persistent-filters';
import { useTrainingSessions } from '@/hooks/use-training-sessions';
import { useToast } from '@/components/feedback/toast-provider';
import { formatDate } from '@/lib/utils/format';
import type { EnrollmentFormValues } from '@/lib/validations/resources';
import { useAuthStore } from '@/stores/auth-store';
import type { Enrollment } from '@/types/resources';

interface EnrollmentRow extends Enrollment {
  employeeName: string;
  sessionName: string;
  enrolledDate: string;
}

export function EnrollmentsPageContent() {
  const defaultFilters = useMemo(
    () => ({
      page: 1,
      pageSize: 50,
      status: '',
    }),
    [],
  );
  const [filters, setFilters] = usePersistentFilters('skillflow-filters-enrollments', defaultFilters);
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const enrollmentsQuery = useEnrollments({ ...filters, organizationId });
  const employeesQuery = useEmployees({ page: 1, pageSize: 100, organizationId });
  const sessionsQuery = useTrainingSessions({ page: 1, pageSize: 100, organizationId });
  const createEnrollment = useCreateEnrollment();
  const cancelEnrollment = useCancelEnrollment();
  const { showToast } = useToast();
  const showApiError = useApiErrorToast();
  const enrollments = enrollmentsQuery.data?.data ?? [];
  const employeeById = useMemo(
    () =>
      new Map(
        (employeesQuery.data?.data ?? []).map((employee) => [
          employee.id,
          `${employee.firstName} ${employee.lastName}`,
        ]),
      ),
    [employeesQuery.data?.data],
  );
  const sessionById = useMemo(
    () => new Map((sessionsQuery.data?.data ?? []).map((session) => [session.id, session.name])),
    [sessionsQuery.data?.data],
  );
  const rows: EnrollmentRow[] = enrollments.map((enrollment) => ({
    ...enrollment,
    employeeName: employeeById.get(enrollment.employeeId) ?? enrollment.employeeId,
    sessionName: sessionById.get(enrollment.trainingSessionId) ?? enrollment.trainingSessionId,
    enrolledDate: formatDate(enrollment.enrolledAt),
  }));
  const confirmed = enrollments.filter((enrollment) => enrollment.status === 'CONFIRMED').length;
  const pending = enrollments.filter((enrollment) => enrollment.status === 'PENDING').length;
  const completed = enrollments.filter((enrollment) => enrollment.status === 'COMPLETED').length;

  async function enroll(values: EnrollmentFormValues) {
    if (!organizationId) {
      return;
    }

    await createEnrollment.mutateAsync({
      organizationId,
      employeeId: values.employeeId,
      trainingSessionId: values.trainingSessionId,
    });
  }

  async function cancel(enrollmentId: string) {
    try {
      await cancelEnrollment.mutateAsync(enrollmentId);
      showToast({ title: 'Inscripción cancelada', description: 'El estado del participante fue actualizado.', tone: 'success' });
    } catch (error) {
      showApiError(error, 'No se pudo cancelar la inscripción');
    }
  }

  const columns: Array<ColumnDef<EnrollmentRow>> = [
    { accessorKey: 'employeeName', header: 'Colaborador' },
    { accessorKey: 'sessionName', header: 'Sesión' },
    { accessorKey: 'enrolledDate', header: 'Inscripción' },
    {
      accessorKey: 'completionPercentage',
      header: 'Avance',
      cell: ({ row }) => `${row.original.completionPercentage ?? 0}%`,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          disabled={row.original.status === 'CANCELLED' || cancelEnrollment.isPending}
          onClick={() => void cancel(row.original.id)}
        >
          Cancelar
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inscripciones"
        description="Monitorea confirmaciones, listas de espera y avance de participantes."
        action={
          <EnrollmentFormDialog
            employees={employeesQuery.data?.data ?? []}
            sessions={(sessionsQuery.data?.data ?? []).filter((session) => ['PUBLISHED', 'SCHEDULED'].includes(session.status))}
            onSubmit={enroll}
          />
        }
        icon={ListChecks}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Confirmadas" value={String(confirmed)} change="Estado de inscripción backend" tone="emerald" icon={UserCheck} />
        <StatCard title="Pendientes" value={String(pending)} change="Cola de aprobación" tone="amber" icon={UsersRound} />
        <StatCard title="Completadas" value={String(completed)} change="Listas para certificados" tone="indigo" icon={UserRoundCheck} />
      </section>
      <FilterBar
        statusValue={filters.status}
        statusOptions={['PENDING', 'CONFIRMED', 'WAITLISTED', 'ENROLLED', 'CANCELLED', 'COMPLETED', 'FAILED']}
        onStatusChange={(status) => setFilters({ status, page: 1 })}
      />
      <SectionCard title="Vista de inscripciones" description="Registros en vivo enriquecidos con colaborador y sesión.">
        {enrollmentsQuery.isLoading ? <LoadingSkeleton /> : null}
        {enrollmentsQuery.isError ? <ErrorState onAction={() => void enrollmentsQuery.refetch()} /> : null}
        {!enrollmentsQuery.isLoading && !enrollmentsQuery.isError && rows.length > 0 ? (
          <DataTable columns={columns} data={rows} />
        ) : null}
        {!enrollmentsQuery.isLoading && !enrollmentsQuery.isError && rows.length === 0 ? (
          <EmptyState icon={ListChecks} title="No se encontraron inscripciones" description="Inscribe colaboradores en sesiones publicadas para iniciar asistencia y evaluación." actionLabel="Inscribir participante" />
        ) : null}
      </SectionCard>
    </div>
  );
}
