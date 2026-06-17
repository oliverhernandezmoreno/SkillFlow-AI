import { Suspense } from 'react';

import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { AppShell } from '@/components/layout/app-shell';
import { CoursesPageContent } from '@/features/courses/courses-page-content';

export default function CoursesPage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingSkeleton />}>
        <CoursesPageContent />
      </Suspense>
    </AppShell>
  );
}
