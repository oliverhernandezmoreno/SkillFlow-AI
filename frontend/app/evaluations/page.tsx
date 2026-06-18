'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ClipboardCheck, Gauge, MessageSquareText, Trophy } from 'lucide-react';
import { Suspense, useMemo } from 'react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { useToast } from '@/components/feedback/toast-provider';
import { FilterBar } from '@/components/forms/filter-bar';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { useApiErrorToast } from '@/hooks/use-api-error-toast';
import { useCreateEvaluation, useEvaluations } from '@/hooks/use-evaluations';
import { usePersistentFilters } from '@/hooks/use-persistent-filters';
import { useTrainingSessions } from '@/hooks/use-training-sessions';
import { formatReference, formatStatus } from '@/lib/formatters/status';
import { useAuthStore } from '@/stores/auth-store';
import type { Evaluation } from '@/types/resources';

export default function EvaluationsPage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingSkeleton />}>
        <EvaluationsPageContent />
      </Suspense>
    </AppShell>
  );
}

function EvaluationsPageContent() {
  const defaultFilters = useMemo(
    () => ({
      page: 1,
      pageSize: 100,
      status: '',
    }),
    [],
  );
  const [filters, setFilters] = usePersistentFilters('skillflow-filters-evaluations', defaultFilters);
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const evaluationsQuery = useEvaluations({ ...filters, organizationId });
  const sessionsQuery = useTrainingSessions({ page: 1, pageSize: 100, organizationId });
  const createEvaluation = useCreateEvaluation();
  const { showToast } = useToast();
  const showApiError = useApiErrorToast();
  const evaluations = evaluationsQuery.data?.data ?? [];
  const sessions = sessionsQuery.data?.data ?? [];
  const closed = evaluations.filter((evaluation) => evaluation.status === 'CLOSED').length;
  const open = evaluations.filter((evaluation) => evaluation.status === 'OPEN').length;
  const averagePassingScore =
    evaluations.length > 0
      ? evaluations.reduce((total, evaluation) => total + (evaluation.passingScore ?? 0), 0) / evaluations.length
      : 0;
  const sessionById = new Map(sessions.map((session) => [session.id, session.name]));

  async function createForFirstSession() {
    if (!organizationId || !sessions[0]) {
      return;
    }

    try {
      await createEvaluation.mutateAsync({
        organizationId,
        trainingSessionId: sessions[0].id,
        type: 'KNOWLEDGE',
        title: `${sessions[0].name} evaluación de conocimientos`,
        passingScore: 70,
      });
      showToast({ title: 'Evaluación creada', description: 'La evaluación está lista para respuestas de participantes.', tone: 'success' });
    } catch (error) {
      showApiError(error, 'No se pudo crear la evaluación');
    }
  }

  const columns: Array<ColumnDef<Evaluation>> = [
    { accessorKey: 'title', header: 'Evaluación' },
    {
      accessorKey: 'trainingSessionId',
      header: 'Sesión',
      cell: ({ row }) => sessionById.get(row.original.trainingSessionId) ?? formatReference(row.original.trainingSessionId),
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => formatStatus(row.original.type),
    },
    {
      accessorKey: 'passingScore',
      header: 'Puntaje aprobación',
      cell: ({ row }) => row.original.passingScore ?? 'N/D',
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
          title="Evaluaciones"
          description="Monitorea pruebas de conocimiento, encuestas y resultados de evaluación práctica."
          action={
            <Button onClick={() => void createForFirstSession()} disabled={createEvaluation.isPending || sessions.length === 0}>
              {createEvaluation.isPending ? 'Creando...' : 'Crear evaluación'}
            </Button>
          }
          icon={ClipboardCheck}
        />
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Cerradas" value={String(closed)} change="Evaluaciones finalizadas" tone="emerald" icon={Trophy} />
          <StatCard title="Abiertas" value={String(open)} change="Esperando respuestas" tone="amber" icon={MessageSquareText} />
          <StatCard title="Puntaje promedio" value={averagePassingScore.toFixed(1)} change="Umbrales configurados" tone="indigo" icon={Gauge} />
        </section>
        <FilterBar
          statusValue={filters.status}
          statusOptions={['OPEN', 'CLOSED']}
          onStatusChange={(status) => setFilters({ status, page: 1 })}
        />
        <SectionCard title="Vista de evaluaciones" description="Registros en vivo desde el backend.">
          {evaluationsQuery.isLoading ? <LoadingSkeleton /> : null}
          {evaluationsQuery.isError ? <ErrorState onAction={() => void evaluationsQuery.refetch()} /> : null}
          {!evaluationsQuery.isLoading && !evaluationsQuery.isError && evaluations.length > 0 ? <DataTable columns={columns} data={evaluations} /> : null}
          {!evaluationsQuery.isLoading && !evaluationsQuery.isError && evaluations.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No se encontraron evaluaciones" description="Crea una evaluación para una sesión y registra puntaje, porcentaje y aprobación." actionLabel="Crear evaluación" />
          ) : null}
        </SectionCard>
    </div>
  );
}
