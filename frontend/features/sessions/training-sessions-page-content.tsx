'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { CalendarDays, GraduationCap, MapPin, Users } from 'lucide-react';
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
import { useCourses } from '@/hooks/use-courses';
import { useEnrollments } from '@/hooks/use-enrollments';
import { usePersistentFilters } from '@/hooks/use-persistent-filters';
import { useCreateTrainingSession, usePublishTrainingSession, useTrainingSessions, useUpdateTrainingSession } from '@/hooks/use-training-sessions';
import { useToast } from '@/components/feedback/toast-provider';
import { TrainingSessionFormDialog } from '@/features/sessions/training-session-form-dialog';
import { formatDate } from '@/lib/utils/format';
import type { TrainingSessionFormValues } from '@/lib/validations/resources';
import { useAuthStore } from '@/stores/auth-store';
import type { TrainingSession } from '@/types/resources';

interface TrainingSessionRow extends TrainingSession {
  courseName: string;
  seats: string;
  dateRange: string;
}

export function TrainingSessionsPageContent() {
  const defaultFilters = useMemo(
    () => ({
      page: 1,
      pageSize: 50,
      status: '',
    }),
    [],
  );
  const [filters, setFilters] = usePersistentFilters('skillflow-filters-training-sessions', defaultFilters);
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const sessionsQuery = useTrainingSessions({ ...filters, organizationId });
  const coursesQuery = useCourses({ page: 1, pageSize: 100, organizationId });
  const enrollmentsQuery = useEnrollments({ page: 1, pageSize: 100, organizationId });
  const createTrainingSession = useCreateTrainingSession();
  const updateTrainingSession = useUpdateTrainingSession();
  const publishTrainingSession = usePublishTrainingSession();
  const { showToast } = useToast();
  const showApiError = useApiErrorToast();
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

  async function create(values: TrainingSessionFormValues) {
    if (!organizationId) {
      return;
    }

    await createTrainingSession.mutateAsync({
      organizationId,
      courseId: values.courseId,
      name: values.name,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      location: values.location || null,
      capacity: values.capacity,
      meetingUrl: values.meetingUrl || null,
    });
  }

  async function update(trainingSessionId: string, values: TrainingSessionFormValues) {
    await updateTrainingSession.mutateAsync({
      trainingSessionId,
      input: {
        courseId: values.courseId,
        name: values.name,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        location: values.location || null,
        capacity: values.capacity,
        meetingUrl: values.meetingUrl || null,
      },
    });
  }

  async function publish(trainingSessionId: string) {
    try {
      await publishTrainingSession.mutateAsync(trainingSessionId);
      showToast({ title: 'Session published', description: 'The session is visible for enrollment workflows.', tone: 'success' });
    } catch (error) {
      showApiError(error, 'Unable to publish session');
    }
  }

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
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex flex-wrap justify-end gap-2">
          <TrainingSessionFormDialog
            mode="edit"
            courses={coursesQuery.data?.data ?? []}
            session={row.original}
            onSubmit={(values) => update(row.original.id, values)}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={row.original.status !== 'SCHEDULED' || publishTrainingSession.isPending}
            onClick={() => void publish(row.original.id)}
          >
            Publish
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Sessions"
        description="Coordinate live training delivery with capacity, instructors and schedule readiness."
        action={
          <TrainingSessionFormDialog mode="create" courses={coursesQuery.data?.data ?? []} onSubmit={create} />
        }
        icon={GraduationCap}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Loaded sessions" value={String(sessionsQuery.data?.meta.total ?? 0)} change="From backend API" tone="indigo" icon={CalendarDays} />
        <StatCard title="Available seats" value={String(availableSeats)} change="Derived from enrollments" tone="cyan" icon={Users} />
        <StatCard title="Upcoming" value={String(upcoming)} change="Based on start dates" tone="slate" icon={MapPin} />
      </section>
      <FilterBar
        statusValue={filters.status}
        statusOptions={['DRAFT', 'SCHEDULED', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CLOSED']}
        onStatusChange={(status) => setFilters({ status, page: 1 })}
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
