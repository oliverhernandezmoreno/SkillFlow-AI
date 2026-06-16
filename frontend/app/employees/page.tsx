'use client';

import { BadgeCheck, UserPlus, Users } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage } from '@/components/layout/resource-page';
import { resourceRows } from '@/features/dashboard/mock-data';

export default function EmployeesPage() {
  return (
    <AppShell>
      <ResourcePage
        title="Employees"
        description="Centralize workforce profiles, roles, areas and training readiness signals."
        actionLabel="Add employee"
        icon={Users}
        rows={resourceRows.employees}
        emptyDescription="Create employee profiles to start enrolling participants in training paths."
        stats={[
          { title: 'Active employees', value: '642', change: '98% profile completeness', tone: 'indigo', icon: Users },
          { title: 'Certified roles', value: '428', change: '67% of active workforce', tone: 'emerald', icon: BadgeCheck },
          { title: 'Open onboarding', value: '24', change: 'New hires this quarter', tone: 'cyan', icon: UserPlus },
        ]}
      />
    </AppShell>
  );
}
