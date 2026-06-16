'use client';

import { DashboardView } from '@/components/dashboard/dashboard-view';
import { AppShell } from '@/components/layout/app-shell';

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardView />
    </AppShell>
  );
}
