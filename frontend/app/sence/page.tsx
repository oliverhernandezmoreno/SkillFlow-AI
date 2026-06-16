'use client';

import { FileCheck2, Landmark, ShieldCheck, TriangleAlert } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage } from '@/components/layout/resource-page';
import { resourceRows } from '@/features/dashboard/mock-data';

export default function SencePage() {
  return (
    <AppShell>
      <ResourcePage
        title="SENCE"
        description="Prepare declaration evidence, tax credit signals and compliance readiness for SENCE workflows."
        actionLabel="Create declaration"
        icon={FileCheck2}
        rows={resourceRows.sence}
        emptyDescription="Create a SENCE declaration from a training session to build evidence and readiness checks."
        stats={[
          { title: 'Ready declarations', value: '24', change: 'Prepared for submission', tone: 'cyan', icon: ShieldCheck },
          { title: 'Projected credit', value: '$8.6M', change: 'CLP in eligible declarations', tone: 'emerald', icon: Landmark },
          { title: 'Missing evidence', value: '6', change: 'Needs coordinator action', tone: 'rose', icon: TriangleAlert },
        ]}
      />
    </AppShell>
  );
}
