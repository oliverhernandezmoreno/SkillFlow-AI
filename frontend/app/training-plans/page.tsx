'use client';

import { BarChart3, CircleDollarSign, FileCheck2, Target } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage } from '@/components/layout/resource-page';
import { resourceRows } from '@/features/dashboard/mock-data';

export default function TrainingPlansPage() {
  return (
    <AppShell>
      <ResourcePage
        title="Training Plans"
        description="Track PAC budgets, priorities and training coverage across the organization."
        actionLabel="Create plan"
        icon={BarChart3}
        rows={resourceRows.trainingPlans}
        emptyDescription="Create an annual training plan to coordinate budget, priorities and course demand."
        stats={[
          { title: 'PAC compliance', value: '84%', change: '+9 points quarter to date', tone: 'emerald', icon: Target },
          { title: 'Approved budget', value: '$24.5M', change: 'CLP planned investment', tone: 'indigo', icon: CircleDollarSign },
          { title: 'Approved plans', value: '7', change: '2 waiting for review', tone: 'cyan', icon: FileCheck2 },
        ]}
      />
    </AppShell>
  );
}
