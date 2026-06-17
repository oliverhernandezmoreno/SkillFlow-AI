'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { BookOpen, Clock3, LibraryBig, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { MetricChart } from '@/components/charts/metric-chart';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { FilterBar } from '@/components/forms/filter-bar';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTable } from '@/components/tables/data-table';
import { CourseFormDialog } from '@/features/courses/course-form-dialog';
import { useCourses, useCreateCourse, useUpdateCourse } from '@/hooks/use-courses';
import type { CourseFormValues } from '@/lib/validations/resources';
import { useAuthStore } from '@/stores/auth-store';
import type { Course } from '@/types/resources';

export function CoursesPageContent() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const coursesQuery = useCourses({ page: 1, pageSize: 50, search, status, organizationId });
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const courses = coursesQuery.data?.data ?? [];
  const activeCourses = courses.filter((course) => course.status === 'ACTIVE').length;
  const averageDuration =
    courses.length > 0
      ? courses.reduce((total, course) => total + course.durationHours, 0) / courses.length
      : 0;

  async function create(values: CourseFormValues) {
    if (!organizationId) {
      return;
    }

    await createCourse.mutateAsync({
      organizationId,
      ...values,
      competencyIds: [],
    });
  }

  async function update(courseId: string, values: CourseFormValues) {
    await updateCourse.mutateAsync({
      courseId,
      input: {
        ...values,
        competencyIds: [],
      },
    });
  }

  const columns: Array<ColumnDef<Course>> = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'modality', header: 'Modality' },
    {
      accessorKey: 'durationHours',
      header: 'Duration',
      cell: ({ row }) => `${row.original.durationHours}h`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <CourseFormDialog mode="edit" course={row.original} onSubmit={(values) => update(row.original.id, values)} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Manage the course catalog that powers annual plans, sessions and certification flows."
        action={<CourseFormDialog mode="create" onSubmit={create} />}
        icon={BookOpen}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Loaded courses" value={String(coursesQuery.data?.meta.total ?? 0)} change="From backend API" tone="indigo" icon={LibraryBig} />
        <StatCard title="Active courses" value={String(activeCourses)} change="Available for planning" tone="emerald" icon={Sparkles} />
        <StatCard title="Average duration" value={`${averageDuration.toFixed(1)}h`} change="Current page average" tone="cyan" icon={Clock3} />
      </section>
      <FilterBar
        searchValue={search}
        statusValue={status}
        statusOptions={['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />
      <SectionCard title="Courses overview" description="Live catalog records from the SkillFlow backend.">
        {coursesQuery.isLoading ? <LoadingSkeleton /> : null}
        {coursesQuery.isError ? <ErrorState onAction={() => void coursesQuery.refetch()} /> : null}
        {!coursesQuery.isLoading && !coursesQuery.isError && courses.length > 0 ? (
          <DataTable columns={columns} data={courses} />
        ) : null}
        {!coursesQuery.isLoading && !coursesQuery.isError && courses.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses found" description="Publish your first course to unlock sessions, enrollments and certificates." actionLabel="Create course" />
        ) : null}
      </SectionCard>
      {courses.length > 0 ? (
        <SectionCard title="Catalog mix" description="Duration profile for the current backend result set.">
          <MetricChart data={courses.slice(0, 6).map((course) => ({ name: course.code, value: course.durationHours }))} dataKey="value" type="bar" />
        </SectionCard>
      ) : null}
    </div>
  );
}
