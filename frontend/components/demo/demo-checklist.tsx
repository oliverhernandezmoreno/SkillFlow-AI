'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, Circle, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

const demoSteps = [
  { label: 'Login', href: '/dashboard' },
  { label: 'Employees', href: '/employees' },
  { label: 'Courses', href: '/courses' },
  { label: 'Sessions', href: '/training-sessions' },
  { label: 'Enrollments', href: '/enrollments' },
  { label: 'Attendance', href: '/attendance' },
  { label: 'Evaluations', href: '/evaluations' },
  { label: 'Certificates', href: '/certificates' },
  { label: 'SENCE', href: '/sence' },
] as const;

export function DemoChecklist({ hasBackendError }: Readonly<{ hasBackendError: boolean }>) {
  const pathname = usePathname();
  const currentIndex = Math.max(
    0,
    demoSteps.findIndex((step) => step.href === pathname),
  );

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Demo flow progress">
      {demoSteps.map((step, index) => {
        const isComplete = index <= currentIndex && !hasBackendError;
        const isCurrent = index === currentIndex;
        const Icon = hasBackendError && isCurrent ? TriangleAlert : isComplete ? CheckCircle2 : Circle;

        return (
          <Link
            key={step.href}
            href={step.href}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isCurrent ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {step.label}
          </Link>
        );
      })}
    </div>
  );
}
