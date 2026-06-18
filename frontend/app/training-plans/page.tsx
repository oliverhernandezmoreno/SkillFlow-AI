'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { BarChart3, CircleDollarSign, FileCheck2, Target } from 'lucide-react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTable } from '@/components/tables/data-table';
import { useTrainingPlans } from '@/hooks/use-training-plans';
import { formatCurrency } from '@/lib/utils/format';
import { useAuthStore } from '@/stores/auth-store';
import type { TrainingPlan } from '@/types/resources';

export default function TrainingPlansPage() {
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const plansQuery = useTrainingPlans({ page: 1, pageSize: 100, organizationId });
  const plans = plansQuery.data?.data ?? [];
  const approved = plans.filter((plan) => ['APPROVED', 'CLOSED'].includes(plan.status)).length;
  const budget = plans.reduce((total, plan) => total + (plan.budgetAmount ?? 0), 0);
  const compliance = plans.length > 0 ? (approved / plans.length) * 100 : 0;

  const columns: Array<ColumnDef<TrainingPlan>> = [
    { accessorKey: 'name', header: 'Plan' },
    { accessorKey: 'year', header: 'Año' },
    {
      accessorKey: 'budgetAmount',
      header: 'Presupuesto',
      cell: ({ row }) => formatCurrency(row.original.budgetAmount ?? 0),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Planes de Capacitación"
          description="Monitorea presupuestos PAC, prioridades y cobertura de capacitación."
          actionLabel="Crear plan"
          icon={BarChart3}
        />
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Cumplimiento PAC" value={`${compliance.toFixed(0)}%`} change="Planes aprobados o cerrados" tone="emerald" icon={Target} />
          <StatCard title="Presupuesto aprobado" value={formatCurrency(budget)} change="Inversión planificada" tone="indigo" icon={CircleDollarSign} />
          <StatCard title="Planes aprobados" value={String(approved)} change={`${plans.length} planes cargados`} tone="cyan" icon={FileCheck2} />
        </section>
        <SectionCard title="Vista de planes" description="Registros anuales en vivo desde el backend.">
          {plansQuery.isLoading ? <LoadingSkeleton /> : null}
          {plansQuery.isError ? <ErrorState onAction={() => void plansQuery.refetch()} /> : null}
          {!plansQuery.isLoading && !plansQuery.isError && plans.length > 0 ? <DataTable columns={columns} data={plans} /> : null}
          {!plansQuery.isLoading && !plansQuery.isError && plans.length === 0 ? (
            <EmptyState icon={BarChart3} title="No se encontraron planes de capacitación" description="Crea planes anuales para coordinar presupuesto, prioridades y demanda de cursos." actionLabel="Crear plan" />
          ) : null}
        </SectionCard>
      </div>
    </AppShell>
  );
}
