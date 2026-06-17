import { AppShell } from '@/components/layout/app-shell';
import { TrainingSessionsPageContent } from '@/features/sessions/training-sessions-page-content';

export default function TrainingSessionsPage() {
  return (
    <AppShell>
      <TrainingSessionsPageContent />
    </AppShell>
  );
}
