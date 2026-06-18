'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, Circle, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

const demoSteps = [
  { label: 'Iniciar sesión', href: '/dashboard' },
  { label: 'Revisar colaboradores', href: '/employees' },
  { label: 'Revisar cursos', href: '/courses' },
  { label: 'Revisar sesiones', href: '/training-sessions' },
  { label: 'Revisar inscripciones', href: '/enrollments' },
  { label: 'Registrar asistencia', href: '/attendance' },
  { label: 'Revisar evaluaciones', href: '/evaluations' },
  { label: 'Emitir certificado', href: '/certificates' },
  { label: 'Validar cumplimiento SENCE', href: '/sence' },
] as const;

export function DemoChecklist({ hasBackendError }: Readonly<{ hasBackendError: boolean }>) {
  const pathname = usePathname();
  const currentIndex = Math.max(
    0,
    demoSteps.findIndex((step) => step.href === pathname),
  );

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Flujo demo sugerido para presentar SkillFlow AI a clientes o inversionistas.
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Progreso del flujo demo">
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
    </div>
  );
}
