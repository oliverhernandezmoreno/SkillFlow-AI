'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { CalendarDays, GraduationCap, MapPin, Users } from 'lucide-react';
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
import { useCourses } from '@/hooks/use-courses';
import { useEnrollments } from '@/hooks/use-enrollments';
import { useTrainingSessions } from '@/hooks/use-training-sessions';
import { formatDate } from '@/lib/utils/format';
import { useAuthStore } from '@/stores/auth-store';
import type { TrainingSession } from '@/types/resources';

interface TrainingSessionRow extends TrainingSession {
  courseName: string;
  seats: string;
  dateRange: string;
}

export function TrainingSessionsPageContent() {
  const [status, setStatus] = useState('');
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const sessionsQuery = useTrainingSessions({ page: 1, pageSize: 50, status, organizationId });
  const coursesQuery = useCourses({ page: 1, pageSize: 100, organizationId });
  const enrollmentsQuery = useEnrollments({ page: 1, pageSize: 100, organizationId });
  const sessions = sessionsQuery.data?.data ?? [];
  const enrollments = useMemo(() => enrollmentsQuery.data?.data ?? [], [enrollmentsQuery.data?.data]);
  const courseById = useMemo(
    () => new Map((coursesQuery.data?.data ?? []).map((course) => [course.id, course.name])),
    [coursesQuery.data?.data],
  );
  const enrollmentCountBySession = useMemo(() => {
    const counts = new Map<string, number>();
    enrollments.forEach((enrollment) => {
      counts.set(enrollment.trainingSessionId, (counts.get(enrollment.trainingSessionId) ?? 0) + 1);
    });
    return counts;
  }, [enrollments]);
  const rows: TrainingSessionRow[] = sessions.map((session) => {
    const enrollmentCount = enrollmentCountBySession.get(session.id) ?? 0;
    return {
      ...session,
      courseName: courseById.get(session.courseId) ?? 'Unassigned course',
      seats: `${enrollmentCount}/${session.capacity}`,
      dateRange: `${formatDate(session.startDate)} - ${formatDate(session.endDate)}`,
    };
  });
  const upcoming = sessions.filter((session) => ['SCHEDULED', 'PUBLISHED'].includes(session.status)).length;
  const availableSeats = sessions.reduce(
    (total, session) => total + Math.max(session.capacity - (enrollmentCountBySession.get(session.id) ?? 0), 0),
    0,
  );

  const columns: Array<ColumnDef<TrainingSessionRow>> = [
    { accessorKey: 'name', header: 'Session' },
    { accessorKey: 'courseName', header: 'Course' },
    { accessorKey: 'dateRange', header: 'Dates' },
    { accessorKey: 'seats', header: 'Seats' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Sessions"
        description="Coordinate live training delivery with capacity, instructors and schedule readiness."
        actionLabel="Schedule session"
        icon={GraduationCap}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Loaded sessions" value={String(sessionsQuery.data?.meta.total ?? 0)} change="From backend API" tone="indigo" icon={CalendarDays} />
        <StatCard title="Available seats" value={String(availableSeats)} change="Derived from enrollments" tone="cyan" icon={Users} />
        <StatCard title="Upcoming" value={String(upcoming)} change="Based on start dates" tone="slate" icon={MapPin} />
      </section>
      <FilterBar
        statusValue={status}
        statusOptions={['DRAFT', 'SCHEDULED', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CLOSED']}
        onStatusChange={setStatus}
      />
      <SectionCard title="Training Sessions overview" description="Live sessions with derived capacity usage.">
        {sessionsQuery.isLoading ? <LoadingSkeleton /> : null}
        {sessionsQuery.isError ? <ErrorState onAction={() => void sessionsQuery.refetch()} /> : null}
        {!sessionsQuery.isLoading && !sessionsQuery.isError && rows.length > 0 ? (
          <DataTable columns={columns} data={rows} />
        ) : null}
        {!sessionsQuery.isLoading && !sessionsQuery.isError && rows.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No training sessions found" description="Schedule sessions from active courses to open enrollments and attendance workflows." actionLabel="Schedule session" />
        ) : null}
      </SectionCard>
    </div>
  );
}
