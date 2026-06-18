'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { LucideIcon } from 'lucide-react';

import { EmptyState } from '@/components/feedback/empty-state';
import { StatusBadge } from '@/components/feedback/status-badge';
import { FilterBar } from '@/components/forms/filter-bar';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { StatCard } from '@/components/dashboard/stat-card';
import { ActionMenu } from '@/components/tables/action-menu';
import { DataTable } from '@/components/tables/data-table';

interface ResourceRow {
  name: string;
  area: string;
  metric: string;
  status: string;
}

interface ResourcePageProps {
  title: string;
  description: string;
  actionLabel: string;
  icon: LucideIcon;
  rows: ResourceRow[];
  stats: Array<{
    title: string;
    value: string;
    change: string;
    tone: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
    icon: LucideIcon;
  }>;
  emptyDescription: string;
}

const columns: Array<ColumnDef<ResourceRow>> = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'area', header: 'Area' },
  { accessorKey: 'metric', header: 'Señal' },
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

export function ResourcePage({
  title,
  description,
  actionLabel,
  icon: Icon,
  rows,
  stats,
  emptyDescription,
}: Readonly<ResourcePageProps>) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} actionLabel={actionLabel} icon={Icon} />
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>
      <FilterBar />
      <SectionCard title={`Vista de ${title.toLowerCase()}`} description="Vista operativa preparada para datos del backend.">
        {rows.length > 0 ? (
          <DataTable columns={columns} data={rows} />
        ) : (
          <EmptyState
            icon={Icon}
            title={`No hay registros de ${title.toLowerCase()}`}
            description={emptyDescription}
            actionLabel={actionLabel}
          />
        )}
      </SectionCard>
    </div>
  );
}
