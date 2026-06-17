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
        title: `${sessions[0].name} knowledge check`,
        passingScore: 70,
      });
      showToast({ title: 'Evaluation created', description: 'The evaluation is ready for participant submissions.', tone: 'success' });
    } catch (error) {
      showApiError(error, 'Unable to create evaluation');
    }
  }

  const columns: Array<ColumnDef<Evaluation>> = [
    { accessorKey: 'title', header: 'Evaluation' },
    {
      accessorKey: 'trainingSessionId',
      header: 'Session',
      cell: ({ row }) => sessionById.get(row.original.trainingSessionId) ?? row.original.trainingSessionId,
    },
    { accessorKey: 'type', header: 'Type' },
    {
      accessorKey: 'passingScore',
      header: 'Passing score',
      cell: ({ row }) => row.original.passingScore ?? 'N/A',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  return (
    <div className="space-y-6">
        <PageHeader
          title="Evaluations"
          description="Track knowledge tests, satisfaction surveys and practical assessment outcomes."
          action={
            <Button onClick={() => void createForFirstSession()} disabled={createEvaluation.isPending || sessions.length === 0}>
              {createEvaluation.isPending ? 'Creating...' : 'Create evaluation'}
            </Button>
          }
          icon={ClipboardCheck}
        />
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Closed" value={String(closed)} change="Finished evaluations" tone="emerald" icon={Trophy} />
          <StatCard title="Open" value={String(open)} change="Awaiting responses" tone="amber" icon={MessageSquareText} />
          <StatCard title="Average passing score" value={averagePassingScore.toFixed(1)} change="Configured thresholds" tone="indigo" icon={Gauge} />
        </section>
        <FilterBar
          statusValue={filters.status}
          statusOptions={['OPEN', 'CLOSED']}
          onStatusChange={(status) => setFilters({ status, page: 1 })}
        />
        <SectionCard title="Evaluations overview" description="Live evaluation records from the backend.">
          {evaluationsQuery.isLoading ? <LoadingSkeleton /> : null}
          {evaluationsQuery.isError ? <ErrorState onAction={() => void evaluationsQuery.refetch()} /> : null}
          {!evaluationsQuery.isLoading && !evaluationsQuery.isError && evaluations.length > 0 ? <DataTable columns={columns} data={evaluations} /> : null}
          {!evaluationsQuery.isLoading && !evaluationsQuery.isError && evaluations.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No evaluations found" description="Create an evaluation for a training session to track score, percentage and pass signals." actionLabel="Create evaluation" />
          ) : null}
        </SectionCard>
    </div>
  );
}
