'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { BookOpen, Clock3, LibraryBig, Sparkles } from 'lucide-react';
import { useMemo } from 'react';

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
import { usePersistentFilters } from '@/hooks/use-persistent-filters';
import { formatStatus } from '@/lib/formatters/status';
import type { CourseFormValues } from '@/lib/validations/resources';
import { useAuthStore } from '@/stores/auth-store';
import type { Course } from '@/types/resources';

export function CoursesPageContent() {
  const defaultFilters = useMemo(
    () => ({
      page: 1,
      pageSize: 50,
      search: '',
      status: '',
    }),
    [],
  );
  const [filters, setFilters] = usePersistentFilters('skillflow-filters-courses', defaultFilters);
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const coursesQuery = useCourses({ ...filters, organizationId });
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
    { accessorKey: 'code', header: 'Código' },
    { accessorKey: 'name', header: 'Nombre' },
    {
      accessorKey: 'modality',
      header: 'Modalidad',
      cell: ({ row }) => formatStatus(row.original.modality),
    },
    {
      accessorKey: 'durationHours',
      header: 'Duración',
      cell: ({ row }) => `${row.original.durationHours}h`,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
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
        title="Cursos"
        description="Gestiona el catálogo que alimenta planes anuales, sesiones y certificaciones."
        action={<CourseFormDialog mode="create" onSubmit={create} />}
        icon={BookOpen}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Cursos cargados" value={String(coursesQuery.data?.meta.total ?? 0)} change="Desde la API backend" tone="indigo" icon={LibraryBig} />
        <StatCard title="Cursos activos" value={String(activeCourses)} change="Disponibles para planificación" tone="emerald" icon={Sparkles} />
        <StatCard title="Duración promedio" value={`${averageDuration.toFixed(1)}h`} change="Promedio de la página actual" tone="cyan" icon={Clock3} />
      </section>
      <FilterBar
        searchValue={filters.search}
        statusValue={filters.status}
        statusOptions={['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']}
        onSearchChange={(search) => setFilters({ search, page: 1 })}
        onStatusChange={(status) => setFilters({ status, page: 1 })}
      />
      <SectionCard title="Vista de cursos" description="Registros en vivo del catálogo SkillFlow.">
        {coursesQuery.isLoading ? <LoadingSkeleton /> : null}
        {coursesQuery.isError ? <ErrorState onAction={() => void coursesQuery.refetch()} /> : null}
        {!coursesQuery.isLoading && !coursesQuery.isError && courses.length > 0 ? (
          <DataTable columns={columns} data={courses} />
        ) : null}
        {!coursesQuery.isLoading && !coursesQuery.isError && courses.length === 0 ? (
          <EmptyState icon={BookOpen} title="No se encontraron cursos" description="Publica el primer curso para habilitar sesiones, inscripciones y certificados." actionLabel="Crear curso" />
        ) : null}
      </SectionCard>
      {courses.length > 0 ? (
        <SectionCard title="Mix de catálogo" description="Perfil de duración para los resultados actuales del backend.">
          <MetricChart data={courses.slice(0, 6).map((course) => ({ name: course.code, value: course.durationHours }))} dataKey="value" type="bar" />
        </SectionCard>
      ) : null}
    </div>
  );
}
