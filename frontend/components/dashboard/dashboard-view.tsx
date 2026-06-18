'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { AlertTriangle, Award, BookOpen, CalendarDays, ClipboardCheck, FileCheck2, LayoutDashboard, Plus, TrendingUp, Users } from 'lucide-react';

import { MetricChart } from '@/components/charts/metric-chart';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { Timeline } from '@/components/dashboard/timeline';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTable } from '@/components/tables/data-table';
import { ActionMenu } from '@/components/tables/action-menu';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { formatDate, formatPercent } from '@/lib/utils/format';

interface UpcomingSession {
  name: string;
  owner: string;
  date: string;
  seats: string;
  status: string;
}

const columns: Array<ColumnDef<UpcomingSession>> = [
  { accessorKey: 'name', header: 'Sesión' },
  { accessorKey: 'owner', header: 'Curso' },
  { accessorKey: 'date', header: 'Fecha' },
  { accessorKey: 'seats', header: 'Cupos' },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'actions',
    header: '',
    cell: () => <ActionMenu />,
  },
];

export function DashboardView() {
  const dashboard = useDashboardData();
  const employees = dashboard.employees.data?.data ?? [];
  const courses = dashboard.courses.data?.data ?? [];
  const sessions = dashboard.trainingSessions.data?.data ?? [];
  const enrollments = dashboard.enrollments.data?.data ?? [];
  const attendance = dashboard.attendance.data?.data ?? [];
  const certificates = dashboard.certificates.data?.data ?? [];
  const evaluations = dashboard.evaluations.data?.data ?? [];
  const senceDeclarations = dashboard.senceDeclarations.data?.data ?? [];
  const activeCourses = courses.filter((course) => course.status === 'ACTIVE').length;
  const activeSessions = sessions.filter((session) =>
    ['SCHEDULED', 'PUBLISHED', 'IN_PROGRESS'].includes(session.status),
  );
  const evaluationsPassed = enrollments.filter((enrollment) => enrollment.approved).length;
  const averageAttendance =
    attendance.length > 0
      ? attendance.reduce((total, record) => total + (record.attendancePercentage ?? 0), 0) / attendance.length
      : 0;
  const readySence = senceDeclarations.filter((declaration) => ['READY', 'SUBMITTED', 'ACCEPTED'].includes(declaration.status)).length;
  const pacCompliance = courses.length > 0 ? Math.min((sessions.length / courses.length) * 100, 100) : 0;
  const criticalAlerts =
    enrollments.filter((enrollment) => ['PENDING', 'WAITLISTED'].includes(enrollment.status)).length +
    senceDeclarations.filter((declaration) => ['REJECTED', 'OBSERVED'].includes(declaration.status)).length;
  const upcomingSessions: UpcomingSession[] = sessions
    .slice()
    .sort((left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime())
    .slice(0, 6)
    .map((session) => {
      const sessionEnrollments = enrollments.filter((enrollment) => enrollment.trainingSessionId === session.id);
      return {
        name: session.name,
        owner: courses.find((course) => course.id === session.courseId)?.name ?? 'Curso pendiente',
        date: formatDate(session.startDate),
        seats: `${sessionEnrollments.length}/${session.capacity}`,
        status: session.status,
      };
    });
  const attendanceTrend = sessions.slice(0, 6).map((session) => {
    const sessionAttendance = attendance.filter((record) => record.trainingSessionId === session.id);
    const attendanceValue =
      sessionAttendance.length > 0
        ? sessionAttendance.reduce((total, record) => total + (record.attendancePercentage ?? 0), 0) /
          sessionAttendance.length
        : 0;
    return { name: session.name.slice(0, 16), attendance: Math.round(attendanceValue) };
  });
  const complianceTrend = [
    { name: 'PAC', compliance: Math.round(pacCompliance) },
    { name: 'Asistencia', compliance: Math.round(averageAttendance) },
    { name: 'Certificados', compliance: certificates.length },
    { name: 'SENCE', compliance: readySence },
  ];
  const timelineItems = sessions.slice(0, 4).map((session) => ({
    title: session.name,
    time: formatDate(session.startDate),
    status: session.status,
  }));
  const executiveStats = [
    { title: 'Colaboradores', value: String(dashboard.employees.data?.meta.total ?? employees.length), change: 'Cargados desde la API', tone: 'indigo' as const, icon: Users },
    { title: 'Cursos activos', value: String(activeCourses), change: 'Catálogo disponible para planificación', tone: 'cyan' as const, icon: BookOpen },
    { title: 'Sesiones activas', value: String(activeSessions.length), change: 'Programadas, publicadas o en curso', tone: 'indigo' as const, icon: CalendarDays },
    { title: 'Inscripciones', value: String(dashboard.enrollments.data?.meta.total ?? enrollments.length), change: `${employees.length} colaboradores cargados`, tone: 'cyan' as const, icon: Users },
    { title: 'Asistencia promedio', value: formatPercent(averageAttendance), change: 'Calculada desde registros de asistencia', tone: 'emerald' as const, icon: TrendingUp },
    { title: 'Evaluaciones aprobadas', value: String(evaluationsPassed), change: `${evaluations.length} evaluaciones cargadas`, tone: 'emerald' as const, icon: ClipboardCheck },
    { title: 'Certificados emitidos', value: String(certificates.length), change: 'Registros de certificados', tone: 'indigo' as const, icon: Award },
    { title: 'Declaraciones SENCE', value: String(senceDeclarations.length), change: `${readySence} listas, enviadas o aceptadas`, tone: 'amber' as const, icon: FileCheck2 },
    { title: 'Alertas críticas', value: String(criticalAlerts), change: 'Pendientes, lista de espera u observadas', tone: 'rose' as const, icon: AlertTriangle },
  ];
  const hasAnyData =
    employees.length +
      courses.length +
      sessions.length +
      enrollments.length +
      attendance.length +
      certificates.length +
      evaluations.length +
      senceDeclarations.length >
    0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel Ejecutivo"
        description="Centro de control en tiempo real para capacitación, cumplimiento y desarrollo organizacional."
        actionLabel="Crear capacitación"
      />

      {dashboard.isLoading ? <LoadingSkeleton /> : null}
      {dashboard.isError ? <ErrorState description="Una o más fuentes del panel no se pudieron cargar." /> : null}
      {!dashboard.isLoading && !dashboard.isError && !hasAnyData ? (
        <EmptyState
          icon={LayoutDashboard}
          title="Sin datos operativos todavía"
          description="Crea colaboradores, cursos y sesiones para poblar el panel ejecutivo."
          actionLabel="Iniciar configuración"
        />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {executiveStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      {hasAnyData ? (
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard title="Tendencia de asistencia" description="Presencia promedio de participantes en programas activos.">
            <MetricChart data={attendanceTrend} dataKey="attendance" />
          </SectionCard>
          <SectionCard title="Cumplimiento PAC" description="Avance de cumplimiento por línea de trabajo.">
            <MetricChart data={complianceTrend} dataKey="compliance" type="bar" />
          </SectionCard>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <SectionCard
          title="Próximas sesiones"
          description="Agenda demo con capacidad y estado de preparación."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/training-sessions">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nueva
              </Link>
            </Button>
          }
        >
          <DataTable columns={columns} data={upcomingSessions} />
        </SectionCard>
        <SectionCard title="Línea de tiempo" description="Hitos relevantes y puntos de control de cumplimiento.">
          <Timeline items={timelineItems} />
        </SectionCard>
      </section>
    </div>
  );
}
