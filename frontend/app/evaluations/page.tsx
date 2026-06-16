'use client';

import { ClipboardCheck, Gauge, MessageSquareText, Trophy } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage } from '@/components/layout/resource-page';
import { resourceRows } from '@/features/dashboard/mock-data';

export default function EvaluationsPage() {
  return (
    <AppShell>
      <ResourcePage
        title="Evaluations"
        description="Track knowledge tests, satisfaction surveys and practical assessment outcomes."
        actionLabel="Create evaluation"
        icon={ClipboardCheck}
        rows={resourceRows.evaluations}
        emptyDescription="Create evaluations for training sessions to unlock certificate eligibility rules."
        stats={[
          { title: 'Passed', value: '87%', change: 'Across closed evaluations', tone: 'emerald', icon: Trophy },
          { title: 'Open responses', value: '134', change: 'Awaiting submission', tone: 'amber', icon: MessageSquareText },
          { title: 'Average score', value: '82.4', change: '+3.1 versus last cohort', tone: 'indigo', icon: Gauge },
        ]}
      />
    </AppShell>
  );
}
