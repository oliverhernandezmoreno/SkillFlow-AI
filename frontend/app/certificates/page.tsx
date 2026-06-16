'use client';

import { Award, BadgeCheck, FileClock, ShieldCheck } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage } from '@/components/layout/resource-page';
import { resourceRows } from '@/features/dashboard/mock-data';

export default function CertificatesPage() {
  return (
    <AppShell>
      <ResourcePage
        title="Certificates"
        description="Issue, verify and monitor certificate eligibility across completed training sessions."
        actionLabel="Issue certificate"
        icon={Award}
        rows={resourceRows.certificates}
        emptyDescription="Certificates appear once attendance and evaluation requirements are satisfied."
        stats={[
          { title: 'Issued', value: '428', change: '52 generated today', tone: 'emerald', icon: BadgeCheck },
          { title: 'Eligibility queue', value: '31', change: 'Pending attendance or score', tone: 'amber', icon: FileClock },
          { title: 'Verifications', value: '1.2K', change: 'Public verification checks', tone: 'cyan', icon: ShieldCheck },
        ]}
      />
    </AppShell>
  );
}
