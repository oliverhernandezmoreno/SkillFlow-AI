'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ListChecks, UserCheck, UserRoundCheck, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';

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
import { useEmployees } from '@/hooks/use-employees';
import { useCancelEnrollment, useCreateEnrollment, useEnrollments } from '@/hooks/use-enrollments';
import { useTrainingSessions } from '@/hooks/use-training-sessions';
import { formatDate } from '@/lib/utils/format';
import { useAuthStore } from '@/stores/auth-store';
import type { Enrollment } from '@/types/resources';

interface EnrollmentRow extends Enrollment {
  employeeName: string;
  sessionName: string;
  enrolledDate: string;
}

export function EnrollmentsPageContent() {
  const [status, setStatus] = useState('');
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const enrollmentsQuery = useEnrollments({ page: 1, pageSize: 50, status, organizationId });
  const employeesQuery = useEmployees({ page: 1, pageSize: 100, organizationId });
  const sessionsQuery = useTrainingSessions({ page: 1, pageSize: 100, organizationId });
  const createEnrollment = useCreateEnrollment();
  const cancelEnrollment = useCancelEnrollment();
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

  async function enrollFirstEmployee() {
    const employee = employeesQuery.data?.data[0];
    const session = sessionsQuery.data?.data.find((item) => ['PUBLISHED', 'SCHEDULED'].includes(item.status));
    if (!organizationId || !employee || !session) {
      return;
    }

    await createEnrollment.mutateAsync({
      organizationId,
      employeeId: employee.id,
      trainingSessionId: session.id,
    });
  }

  const columns: Array<ColumnDef<EnrollmentRow>> = [
    { accessorKey: 'employeeName', header: 'Employee' },
    { accessorKey: 'sessionName', header: 'Session' },
    { accessorKey: 'enrolledDate', header: 'Enrolled' },
    {
      accessorKey: 'completionPercentage',
      header: 'Progress',
      cell: ({ row }) => `${row.original.completionPercentage ?? 0}%`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
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
          onClick={() => void cancelEnrollment.mutate(row.original.id)}
        >
          Cancel
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        description="Monitor participant confirmations, waitlists and completion progress."
        action={
          <Button onClick={() => void enrollFirstEmployee()} disabled={createEnrollment.isPending || !employeesQuery.data?.data[0]}>
            {createEnrollment.isPending ? 'Enrolling...' : 'Enroll participant'}
          </Button>
        }
        icon={ListChecks}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Confirmed" value={String(confirmed)} change="Backend enrollment status" tone="emerald" icon={UserCheck} />
        <StatCard title="Pending" value={String(pending)} change="Approval queue" tone="amber" icon={UsersRound} />
        <StatCard title="Completed" value={String(completed)} change="Ready for certificate checks" tone="indigo" icon={UserRoundCheck} />
      </section>
      <FilterBar
        statusValue={status}
        statusOptions={['PENDING', 'CONFIRMED', 'WAITLISTED', 'ENROLLED', 'CANCELLED', 'COMPLETED', 'FAILED']}
        onStatusChange={setStatus}
      />
      <SectionCard title="Enrollments overview" description="Live enrollment records enriched with employee and session names.">
        {enrollmentsQuery.isLoading ? <LoadingSkeleton /> : null}
        {enrollmentsQuery.isError ? <ErrorState onAction={() => void enrollmentsQuery.refetch()} /> : null}
        {!enrollmentsQuery.isLoading && !enrollmentsQuery.isError && rows.length > 0 ? (
          <DataTable columns={columns} data={rows} />
        ) : null}
        {!enrollmentsQuery.isLoading && !enrollmentsQuery.isError && rows.length === 0 ? (
          <EmptyState icon={ListChecks} title="No enrollments found" description="Enroll employees into published sessions to begin attendance and evaluation tracking." actionLabel="Enroll participant" />
        ) : null}
      </SectionCard>
    </div>
  );
}
