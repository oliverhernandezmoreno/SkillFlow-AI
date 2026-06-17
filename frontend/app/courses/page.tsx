import { AppShell } from '@/components/layout/app-shell';
import { CoursesPageContent } from '@/features/courses/courses-page-content';

export default function CoursesPage() {
  return (
    <AppShell>
      <CoursesPageContent />
    </AppShell>
  );
}
