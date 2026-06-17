import { Suspense } from 'react';

import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { AppShell } from '@/components/layout/app-shell';
import { EmployeesPageContent } from '@/features/employees/employees-page-content';

export default function EmployeesPage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingSkeleton />}>
        <EmployeesPageContent />
      </Suspense>
    </AppShell>
  );
}
