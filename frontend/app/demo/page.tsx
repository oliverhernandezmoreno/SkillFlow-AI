import { ArrowRight, Award, BarChart3, BookOpen, CalendarDays, ClipboardCheck, FileCheck2, Timer, Users } from 'lucide-react';
import Link from 'next/link';

import { PublicSiteShell } from '@/components/marketing/public-site-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const demoSteps = [
  { title: 'Panel Ejecutivo', description: 'KPIs, cumplimiento, alertas y señales de auditoría.', icon: BarChart3 },
  { title: 'Colaboradores', description: 'Perfiles del equipo y organización por áreas.', icon: Users },
  { title: 'Cursos', description: 'Catálogo crítico para capacitación y cumplimiento.', icon: BookOpen },
  { title: 'Sesiones', description: 'Agenda, cupos y estado de ejecución.', icon: CalendarDays },
  { title: 'Asistencia', description: 'Evidencia operacional de participación.', icon: ClipboardCheck },
  { title: 'Evaluaciones', description: 'Resultados y aprobación por actividad.', icon: ClipboardCheck },
  { title: 'Certificados', description: 'Certificación digital verificable.', icon: Award },
  { title: 'SENCE', description: 'Checklist de evidencias y readiness de cumplimiento.', icon: FileCheck2 },
] as const;

export default function DemoPage() {
  return (
    <PublicSiteShell>
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:items-end">
          <div>
            <div className="mb-4 inline-flex rounded-full border bg-card px-3 py-1 text-sm font-medium text-primary shadow-sm">
              Demo comercial guiada
            </div>
            <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">Demostración Guiada SkillFlow AI</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Una ruta compacta para presentar valor a RRHH, operaciones, OTEC, OTIC e inversionistas.
            </p>
          </div>
          <Card className="p-5">
            <Timer className="h-6 w-6 text-primary" aria-hidden="true" />
            <p className="mt-4 text-3xl font-semibold tracking-normal">7 minutos</p>
            <p className="mt-1 text-sm text-muted-foreground">Tiempo estimado para recorrer el flujo completo.</p>
          </Card>
        </div>
        <div className="mt-8">
          <Button asChild className="h-11 px-5">
            <Link href="/login">
              Ingresar a la Demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {demoSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-xs font-semibold text-muted-foreground">Paso {index + 1}</span>
                </div>
                <h2 className="mt-4 text-base font-semibold tracking-normal">{step.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </Card>
            );
          })}
        </div>
      </section>
    </PublicSiteShell>
  );
}
