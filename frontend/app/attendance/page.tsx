'use client';

import { CalendarCheck, CheckCircle2, QrCode, TriangleAlert } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage } from '@/components/layout/resource-page';
import { resourceRows } from '@/features/dashboard/mock-data';

export default function AttendancePage() {
  return (
    <AppShell>
      <ResourcePage
        title="Attendance"
        description="Capture attendance evidence, QR check-ins and completion signals for certification."
        actionLabel="Record attendance"
        icon={CalendarCheck}
        rows={resourceRows.attendance}
        emptyDescription="Attendance records appear here once participants check in or are marked manually."
        stats={[
          { title: 'Average attendance', value: '91%', change: '+4.3 points quarter to date', tone: 'emerald', icon: CheckCircle2 },
          { title: 'QR ready sessions', value: '12', change: 'Prepared for mobile check-in', tone: 'cyan', icon: QrCode },
          { title: 'Anomalies', value: '3', change: 'Need coordinator review', tone: 'rose', icon: TriangleAlert },
        ]}
      />
    </AppShell>
  );
}
