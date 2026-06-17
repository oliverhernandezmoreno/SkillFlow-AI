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
    { accessorKey: 'year', header: 'Year' },
    {
      accessorKey: 'budgetAmount',
      header: 'Budget',
      cell: ({ row }) => formatCurrency(row.original.budgetAmount ?? 0),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Training Plans"
          description="Track PAC budgets, priorities and training coverage across the organization."
          actionLabel="Create plan"
          icon={BarChart3}
        />
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="PAC compliance" value={`${compliance.toFixed(0)}%`} change="Approved or closed plans" tone="emerald" icon={Target} />
          <StatCard title="Approved budget" value={formatCurrency(budget)} change="Planned investment" tone="indigo" icon={CircleDollarSign} />
          <StatCard title="Approved plans" value={String(approved)} change={`${plans.length} plans loaded`} tone="cyan" icon={FileCheck2} />
        </section>
        <SectionCard title="Training Plans overview" description="Live annual planning records from the backend.">
          {plansQuery.isLoading ? <LoadingSkeleton /> : null}
          {plansQuery.isError ? <ErrorState onAction={() => void plansQuery.refetch()} /> : null}
          {!plansQuery.isLoading && !plansQuery.isError && plans.length > 0 ? <DataTable columns={columns} data={plans} /> : null}
          {!plansQuery.isLoading && !plansQuery.isError && plans.length === 0 ? (
            <EmptyState icon={BarChart3} title="No training plans found" description="Create annual training plans to coordinate budget, priorities and course demand." actionLabel="Create plan" />
          ) : null}
        </SectionCard>
      </div>
    </AppShell>
  );
}
