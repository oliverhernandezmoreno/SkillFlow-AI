import { BarChart3, Bot, CheckCircle2, FileCheck2, Network, ShoppingBag, Sparkles, Users } from 'lucide-react';

import { PublicSiteShell } from '@/components/marketing/public-site-shell';
import { Card } from '@/components/ui/card';

const roadmapGroups = [
  {
    title: 'Disponible hoy',
    description: 'Capacidades listas para demo comercial y pilotos iniciales.',
    items: [
      'Gestión capacitación',
      'Cursos',
      'Asistencia',
      'Evaluaciones',
      'Certificados',
      'SENCE Readiness',
    ],
    icon: CheckCircle2,
  },
  {
    title: 'Próximamente',
    description: 'Capacidades planificadas para profundizar valor ejecutivo.',
    items: [
      'IA para detección de brechas',
      'Analytics avanzados',
      'Reportes ejecutivos',
    ],
    icon: BarChart3,
  },
  {
    title: 'Futuro',
    description: 'Visión de plataforma para escalar ecosistema y automatización.',
    items: [
      'Integración SENCE oficial',
      'Marketplace OTEC',
      'Workforce Intelligence',
      'Copilot RRHH',
    ],
    icon: Sparkles,
  },
] as const;

const futureSignals = [
  { label: 'Integración oficial', icon: FileCheck2 },
  { label: 'Marketplace', icon: ShoppingBag },
  { label: 'Inteligencia laboral', icon: Network },
  { label: 'Copilot RRHH', icon: Bot },
  { label: 'Escala empresarial', icon: Users },
] as const;

export default function RoadmapPage() {
  return (
    <PublicSiteShell>
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex rounded-full border bg-card px-3 py-1 text-sm font-medium text-primary shadow-sm">
            Visión de producto
          </div>
          <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">Roadmap</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Una ruta clara desde gestión operacional de capacitación hacia inteligencia de fuerza laboral.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {roadmapGroups.map((group) => {
            const Icon = group.icon;
            return (
              <Card key={group.title} className="p-5">
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h2 className="mt-4 text-xl font-semibold tracking-normal">{group.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{group.description}</p>
                <ul className="mt-5 space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {futureSignals.map((signal) => {
            const Icon = signal.icon;
            return (
              <span key={signal.label} className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                {signal.label}
              </span>
            );
          })}
        </div>
      </section>
    </PublicSiteShell>
  );
}
