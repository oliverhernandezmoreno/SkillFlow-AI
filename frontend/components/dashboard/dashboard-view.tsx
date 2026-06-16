'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import { MetricChart } from '@/components/charts/metric-chart';
import { StatusBadge } from '@/components/feedback/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { Timeline } from '@/components/dashboard/timeline';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTable } from '@/components/tables/data-table';
import { ActionMenu } from '@/components/tables/action-menu';
import { Button } from '@/components/ui/button';
import {
  attendanceTrend,
  complianceTrend,
  executiveStats,
  timelineItems,
  upcomingSessions,
} from '@/features/dashboard/mock-data';

type UpcomingSession = (typeof upcomingSessions)[number];

const columns: Array<ColumnDef<UpcomingSession>> = [
  { accessorKey: 'name', header: 'Session' },
  { accessorKey: 'owner', header: 'Owner' },
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'seats', header: 'Seats' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'actions',
    header: '',
    cell: () => <ActionMenu />,
  },
];

export function DashboardView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Dashboard"
        description="A real-time command center for training operations, compliance progress and workforce readiness."
        actionLabel="Create training"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {executiveStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Attendance trend" description="Average participant presence across active programs.">
          <MetricChart data={attendanceTrend} dataKey="attendance" />
        </SectionCard>
        <SectionCard title="PAC compliance" description="Completion by workforce area.">
          <MetricChart data={complianceTrend} dataKey="compliance" type="bar" />
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <SectionCard
          title="Upcoming sessions"
          description="Commercial demo schedule with capacity and readiness status."
          action={
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New
            </Button>
          }
        >
          <DataTable columns={columns} data={upcomingSessions} />
        </SectionCard>
        <SectionCard title="Training timeline" description="Important milestones and compliance checkpoints.">
          <Timeline items={timelineItems} />
        </SectionCard>
      </section>
    </div>
  );
}
