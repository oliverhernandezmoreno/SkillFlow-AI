'use client';

import { BookOpen, Clock3, LibraryBig, Sparkles } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage } from '@/components/layout/resource-page';
import { resourceRows } from '@/features/dashboard/mock-data';

export default function CoursesPage() {
  return (
    <AppShell>
      <ResourcePage
        title="Courses"
        description="Manage the course catalog that powers annual plans, sessions and certification flows."
        actionLabel="Create course"
        icon={BookOpen}
        rows={resourceRows.courses}
        emptyDescription="Publish your first course to unlock sessions, enrollments and certificates."
        stats={[
          { title: 'Active courses', value: '38', change: '12 with SENCE code', tone: 'indigo', icon: LibraryBig },
          { title: 'Average duration', value: '7.5h', change: 'Balanced for field operations', tone: 'cyan', icon: Clock3 },
          { title: 'AI-ready metadata', value: '64%', change: 'Competency mapping coverage', tone: 'emerald', icon: Sparkles },
        ]}
      />
    </AppShell>
  );
}
