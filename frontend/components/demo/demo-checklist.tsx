'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, Circle, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

const demoSteps = [
  { label: 'Panel Ejecutivo', description: 'KPIs, alertas y señales de confianza.', href: '/dashboard' },
  { label: 'Colaboradores', description: 'Perfiles y áreas de la organización.', href: '/employees' },
  { label: 'Cursos críticos', description: 'Catálogo de capacitación prioritaria.', href: '/courses' },
  { label: 'Sesiones', description: 'Agenda, cupos y estado de ejecución.', href: '/training-sessions' },
  { label: 'Asistencia', description: 'Evidencia operacional de participación.', href: '/attendance' },
  { label: 'Evaluaciones', description: 'Resultados y umbrales de aprobación.', href: '/evaluations' },
  { label: 'Certificados', description: 'Evidencia verificable de capacitación.', href: '/certificates' },
  { label: 'SENCE', description: 'Checklist de preparación de evidencias.', href: '/sence' },
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
        Ruta sugerida para presentar SkillFlow AI en 7 minutos.
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
                'inline-flex min-h-16 w-48 shrink-0 items-start gap-2 rounded-md border px-3 py-2 text-left text-xs transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isCurrent ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground',
              )}
            >
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                <span className="block font-semibold">{step.label}</span>
                <span className="mt-1 block leading-snug">{step.description}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
