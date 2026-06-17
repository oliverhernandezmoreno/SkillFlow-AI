'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { FileCheck2, Landmark, ShieldCheck, TriangleAlert } from 'lucide-react';

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
import { useCreateSenceDeclaration, useSenceActions, useSenceDeclarations } from '@/hooks/use-sence';
import { useTrainingSessions } from '@/hooks/use-training-sessions';
import { formatCurrency } from '@/lib/utils/format';
import { useAuthStore } from '@/stores/auth-store';
import type { SenceDeclaration } from '@/types/resources';

export default function SencePage() {
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const declarationsQuery = useSenceDeclarations({ page: 1, pageSize: 100, organizationId });
  const sessionsQuery = useTrainingSessions({ page: 1, pageSize: 100, organizationId });
  const createDeclaration = useCreateSenceDeclaration();
  const senceActions = useSenceActions();
  const declarations = declarationsQuery.data?.data ?? [];
  const sessions = sessionsQuery.data?.data ?? [];
  const ready = declarations.filter((declaration) => declaration.status === 'READY').length;
  const missingEvidence = declarations.filter((declaration) => ['DRAFT', 'OBSERVED', 'REJECTED'].includes(declaration.status)).length;
  const projectedCredit = declarations.reduce((total, declaration) => total + (declaration.taxCreditAmount ?? 0), 0);
  const sessionById = new Map(sessions.map((session) => [session.id, session.name]));

  async function createFromFirstSession() {
    if (!sessions[0]) {
      return;
    }

    await createDeclaration.mutateAsync({ trainingSessionId: sessions[0].id });
  }

  const columns: Array<ColumnDef<SenceDeclaration>> = [
    {
      accessorKey: 'trainingSessionId',
      header: 'Session',
      cell: ({ row }) => sessionById.get(row.original.trainingSessionId) ?? row.original.trainingSessionId,
    },
    { accessorKey: 'senceCode', header: 'SENCE code' },
    {
      accessorKey: 'taxCreditAmount',
      header: 'Tax credit',
      cell: ({ row }) => formatCurrency(row.original.taxCreditAmount ?? 0),
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
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void senceActions.validate.mutate(row.original.id)}>
            Validate
          </Button>
          <Button size="sm" variant="outline" onClick={() => void senceActions.ready.mutate(row.original.id)}>
            Ready
          </Button>
          <Button size="sm" variant="outline" onClick={() => void senceActions.submit.mutate(row.original.id)}>
            Submit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="SENCE"
          description="Prepare declaration evidence, tax credit signals and compliance readiness for SENCE workflows."
          action={
            <Button onClick={() => void createFromFirstSession()} disabled={createDeclaration.isPending || sessions.length === 0}>
              {createDeclaration.isPending ? 'Creating...' : 'Create declaration'}
            </Button>
          }
          icon={FileCheck2}
        />
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Ready declarations" value={String(ready)} change="Prepared for submission" tone="cyan" icon={ShieldCheck} />
          <StatCard title="Projected credit" value={formatCurrency(projectedCredit)} change="Eligible declaration value" tone="emerald" icon={Landmark} />
          <StatCard title="Needs evidence" value={String(missingEvidence)} change="Draft, observed or rejected" tone="rose" icon={TriangleAlert} />
        </section>
        <SectionCard title="SENCE declaration wizard" description="Validate, prepare and submit declarations through backend workflow actions.">
          {declarationsQuery.isLoading ? <LoadingSkeleton /> : null}
          {declarationsQuery.isError ? <ErrorState onAction={() => void declarationsQuery.refetch()} /> : null}
          {!declarationsQuery.isLoading && !declarationsQuery.isError && declarations.length > 0 ? <DataTable columns={columns} data={declarations} /> : null}
          {!declarationsQuery.isLoading && !declarationsQuery.isError && declarations.length === 0 ? (
            <EmptyState icon={FileCheck2} title="No SENCE declarations found" description="Create a declaration from a training session to build readiness checks and evidence." actionLabel="Create declaration" />
          ) : null}
        </SectionCard>
      </div>
    </AppShell>
  );
}
