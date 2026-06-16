'use client';

import { CalendarDays, GraduationCap, MapPin, Users } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage } from '@/components/layout/resource-page';
import { resourceRows } from '@/features/dashboard/mock-data';

export default function TrainingSessionsPage() {
  return (
    <AppShell>
      <ResourcePage
        title="Training Sessions"
        description="Coordinate live training delivery with capacity, instructors and schedule readiness."
        actionLabel="Schedule session"
        icon={GraduationCap}
        rows={resourceRows.sessions}
        emptyDescription="Schedule sessions from active courses to open enrollments and attendance workflows."
        stats={[
          { title: 'This month', value: '18', change: '6 already published', tone: 'indigo', icon: CalendarDays },
          { title: 'Available seats', value: '84', change: 'Across upcoming sessions', tone: 'cyan', icon: Users },
          { title: 'On-site rooms', value: '5', change: 'Santiago and Antofagasta', tone: 'slate', icon: MapPin },
        ]}
      />
    </AppShell>
  );
}
