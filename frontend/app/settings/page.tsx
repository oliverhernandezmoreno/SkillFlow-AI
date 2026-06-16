'use client';

import { Building2, KeyRound, Settings, ShieldCheck } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage } from '@/components/layout/resource-page';

export default function SettingsPage() {
  return (
    <AppShell>
      <ResourcePage
        title="Settings"
        description="Manage organization preferences, authentication policies and platform configuration."
        actionLabel="Update settings"
        icon={Settings}
        rows={[
          { name: 'Organization profile', area: 'Workspace', metric: 'SkillFlow Demo', status: 'Active' },
          { name: 'Authentication policy', area: 'Security', metric: 'JWT enabled', status: 'Active' },
          { name: 'Compliance defaults', area: 'SENCE', metric: 'Demo mode', status: 'Ready' },
        ]}
        emptyDescription="Configure organization settings after connecting the production backend."
        stats={[
          { title: 'Workspace', value: '1', change: 'SkillFlow Demo active', tone: 'indigo', icon: Building2 },
          { title: 'RBAC policies', value: '42', change: 'Mapped permissions', tone: 'emerald', icon: ShieldCheck },
          { title: 'Token flows', value: '2', change: 'Access and refresh', tone: 'cyan', icon: KeyRound },
        ]}
      />
    </AppShell>
  );
}
