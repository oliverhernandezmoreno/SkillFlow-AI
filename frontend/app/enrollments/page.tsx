'use client';

import { ListChecks, UserCheck, UserRoundCheck, UsersRound } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage } from '@/components/layout/resource-page';
import { resourceRows } from '@/features/dashboard/mock-data';

export default function EnrollmentsPage() {
  return (
    <AppShell>
      <ResourcePage
        title="Enrollments"
        description="Monitor participant confirmations, waitlists and completion progress."
        actionLabel="Enroll participant"
        icon={ListChecks}
        rows={resourceRows.enrollments}
        emptyDescription="Enroll employees into published sessions to begin attendance and evaluation tracking."
        stats={[
          { title: 'Confirmed', value: '512', change: '80% of planned seats', tone: 'emerald', icon: UserCheck },
          { title: 'Pending', value: '46', change: 'Manager approval queue', tone: 'amber', icon: UsersRound },
          { title: 'Completed', value: '386', change: 'Ready for certificate checks', tone: 'indigo', icon: UserRoundCheck },
        ]}
      />
    </AppShell>
  );
}
