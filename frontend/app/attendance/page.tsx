'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { CalendarCheck, CheckCircle2, ClipboardList, Percent } from 'lucide-react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { useAttendance, useCreateBulkAttendance } from '@/hooks/use-attendance';
import { useEnrollments } from '@/hooks/use-enrollments';
import { useTrainingSessions } from '@/hooks/use-training-sessions';
import { formatPercent } from '@/lib/utils/format';
import { useAuthStore } from '@/stores/auth-store';
import type { AttendanceRecord } from '@/types/resources';

export default function AttendancePage() {
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const attendanceQuery = useAttendance({ page: 1, pageSize: 100, organizationId });
  const enrollmentsQuery = useEnrollments({ page: 1, pageSize: 100, organizationId });
  const sessionsQuery = useTrainingSessions({ page: 1, pageSize: 100, organizationId });
  const bulkAttendance = useCreateBulkAttendance();
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
  }

  const columns: Array<ColumnDef<AttendanceRecord>> = [
    {
      accessorKey: 'trainingSessionId',
      header: 'Session',
      cell: ({ row }) => sessionById.get(row.original.trainingSessionId) ?? row.original.trainingSessionId,
    },
    { accessorKey: 'employeeId', header: 'Employee' },
    { accessorKey: 'method', header: 'Method' },
    {
      accessorKey: 'attendancePercentage',
      header: 'Percentage',
      cell: ({ row }) => formatPercent(row.original.attendancePercentage ?? 0),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Attendance"
          description="Capture attendance evidence, QR check-ins and completion signals for certification."
          action={
            <Button onClick={() => void markFirstSessionPresent()} disabled={bulkAttendance.isPending || sessions.length === 0}>
              {bulkAttendance.isPending ? 'Recording...' : 'Bulk mark present'}
            </Button>
          }
          icon={CalendarCheck}
        />
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Records" value={String(attendanceQuery.data?.meta.total ?? records.length)} change="Live attendance API" tone="indigo" icon={ClipboardList} />
          <StatCard title="Average attendance" value={formatPercent(averageAttendance)} change="Derived from records" tone="emerald" icon={Percent} />
          <StatCard title="Present" value={String(presentRecords)} change="Manual and digital records" tone="cyan" icon={CheckCircle2} />
        </section>
        <SectionCard title="Attendance overview" description="Attendance records grouped by session and participant.">
          {attendanceQuery.isLoading ? <LoadingSkeleton /> : null}
          {attendanceQuery.isError ? <ErrorState onAction={() => void attendanceQuery.refetch()} /> : null}
          {!attendanceQuery.isLoading && !attendanceQuery.isError && records.length > 0 ? <DataTable columns={columns} data={records} /> : null}
          {!attendanceQuery.isLoading && !attendanceQuery.isError && records.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No attendance records found" description="Use bulk mark present after enrollments exist for a scheduled session." actionLabel="Record attendance" />
          ) : null}
        </SectionCard>
      </div>
    </AppShell>
  );
}
