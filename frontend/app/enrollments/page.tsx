import { Suspense } from 'react';

import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { AppShell } from '@/components/layout/app-shell';
import { EnrollmentsPageContent } from '@/features/enrollments/enrollments-page-content';

export default function EnrollmentsPage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingSkeleton />}>
        <EnrollmentsPageContent />
      </Suspense>
    </AppShell>
  );
}
