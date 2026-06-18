'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { CalendarCheck, CheckCircle2, ClipboardList, Percent } from 'lucide-react';
import { Suspense, useMemo } from 'react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { FilterBar } from '@/components/forms/filter-bar';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { useApiErrorToast } from '@/hooks/use-api-error-toast';
import { useAttendance, useCreateBulkAttendance } from '@/hooks/use-attendance';
import { useEnrollments } from '@/hooks/use-enrollments';
import { usePersistentFilters } from '@/hooks/use-persistent-filters';
import { useTrainingSessions } from '@/hooks/use-training-sessions';
import { useToast } from '@/components/feedback/toast-provider';
import { formatPercent } from '@/lib/utils/format';
import { useAuthStore } from '@/stores/auth-store';
import type { AttendanceRecord } from '@/types/resources';

export default function AttendancePage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingSkeleton />}>
        <AttendancePageContent />
      </Suspense>
    </AppShell>
  );
}

function AttendancePageContent() {
  const defaultFilters = useMemo(
    () => ({
      page: 1,
      pageSize: 100,
      status: '',
    }),
    [],
  );
  const [filters, setFilters] = usePersistentFilters('skillflow-filters-attendance', defaultFilters);
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const attendanceQuery = useAttendance({ ...filters, organizationId });
  const enrollmentsQuery = useEnrollments({ page: 1, pageSize: 100, organizationId });
  const sessionsQuery = useTrainingSessions({ page: 1, pageSize: 100, organizationId });
  const bulkAttendance = useCreateBulkAttendance();
  const { showToast } = useToast();
  const showApiError = useApiErrorToast();
  const records = attendanceQuery.data?.data ?? [];
  const enrollments = enrollmentsQuery.data?.data ?? [];
  const sessions = sessionsQuery.data?.data ?? [];
  const averageAttendance =
    records.length > 0
      ? records.reduce((total, record) => total + (record.attendancePercentage ?? 0), 0) / records.length
      : 0;
  const presentRecords = records.filter((record) => record.status === 'PRESENT').length;
  const sessionById = new Map(sessions.map((session) => [session.id, session.name]));

  async function markFirstSessionPresent() {
    if (!organizationId) {
      return;
    }

    const session = sessions[0];
    const sessionEnrollments = enrollments.filter((enrollment) => enrollment.trainingSessionId === session?.id);
    if (!session || sessionEnrollments.length === 0) {
      return;
    }

    try {
      await bulkAttendance.mutateAsync({
        organizationId,
        trainingSessionId: session.id,
        records: sessionEnrollments.map((enrollment) => ({
          enrollmentId: enrollment.id,
          employeeId: enrollment.employeeId,
          status: 'PRESENT',
          method: 'MANUAL',
        })),
      });
      showToast({ title: 'Asistencia registrada', description: 'La asistencia masiva quedó sincronizada con el backend.', tone: 'success' });
    } catch (error) {
      showApiError(error, 'No se pudo registrar asistencia');
    }
  }

  const columns: Array<ColumnDef<AttendanceRecord>> = [
    {
      accessorKey: 'trainingSessionId',
      header: 'Sesión',
      cell: ({ row }) => sessionById.get(row.original.trainingSessionId) ?? row.original.trainingSessionId,
    },
    { accessorKey: 'employeeId', header: 'Colaborador' },
    { accessorKey: 'method', header: 'Método' },
    {
      accessorKey: 'attendancePercentage',
      header: 'Porcentaje',
      cell: ({ row }) => formatPercent(row.original.attendancePercentage ?? 0),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  return (
    <div className="space-y-6">
        <PageHeader
          title="Asistencia"
          description="Registra evidencia de asistencia, check-ins y señales de finalización para certificación."
          action={
            <Button onClick={() => void markFirstSessionPresent()} disabled={bulkAttendance.isPending || sessions.length === 0}>
              {bulkAttendance.isPending ? 'Registrando...' : 'Marcar presentes'}
            </Button>
          }
          icon={CalendarCheck}
        />
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Registros" value={String(attendanceQuery.data?.meta.total ?? records.length)} change="API de asistencia en vivo" tone="indigo" icon={ClipboardList} />
          <StatCard title="Asistencia promedio" value={formatPercent(averageAttendance)} change="Calculada desde registros" tone="emerald" icon={Percent} />
          <StatCard title="Presentes" value={String(presentRecords)} change="Registros manuales y digitales" tone="cyan" icon={CheckCircle2} />
        </section>
        <FilterBar
          statusValue={filters.status}
          statusOptions={['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'INCOMPLETE']}
          onStatusChange={(status) => setFilters({ status, page: 1 })}
        />
        <SectionCard title="Vista de asistencia" description="Registros agrupados por sesión y participante.">
          {attendanceQuery.isLoading ? <LoadingSkeleton /> : null}
          {attendanceQuery.isError ? <ErrorState onAction={() => void attendanceQuery.refetch()} /> : null}
          {!attendanceQuery.isLoading && !attendanceQuery.isError && records.length > 0 ? <DataTable columns={columns} data={records} /> : null}
          {!attendanceQuery.isLoading && !attendanceQuery.isError && records.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No se encontraron registros de asistencia" description="Usa marcar presentes cuando existan inscripciones para una sesión programada." actionLabel="Registrar asistencia" />
          ) : null}
        </SectionCard>
    </div>
  );
}
