import { Suspense } from 'react';

import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { AppShell } from '@/components/layout/app-shell';
import { TrainingSessionsPageContent } from '@/features/sessions/training-sessions-page-content';

export default function TrainingSessionsPage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingSkeleton />}>
        <TrainingSessionsPageContent />
      </Suspense>
    </AppShell>
  );
}
