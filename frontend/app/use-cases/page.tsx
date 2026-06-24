import { Building2, Factory, Hammer, HardHat, ShoppingBag, UsersRound } from 'lucide-react';

import { PublicSiteShell } from '@/components/marketing/public-site-shell';
import { Card } from '@/components/ui/card';

const useCases = [
  {
    title: 'Minería',
    icon: HardHat,
    problem: 'Alta criticidad operacional, capacitaciones obligatorias y necesidad de evidencia para auditorías.',
    solution: 'SkillFlow AI ordena cursos críticos, sesiones, asistencia, evaluaciones, certificados y readiness SENCE.',
    benefit: 'Menor riesgo operativo y mejor visibilidad para RRHH, seguridad y operaciones.',
  },
  {
    title: 'Manufactura',
    icon: Factory,
    problem: 'Equipos distribuidos, turnos, inducciones recurrentes y control manual de cumplimiento.',
    solution: 'La plataforma centraliza colaboradores, cursos, sesiones y certificación digital por área.',
    benefit: 'Más control sobre entrenamiento obligatorio y reducción de brechas de capacitación.',
  },
  {
    title: 'Construcción',
    icon: Hammer,
    problem: 'Alta rotación, trabajo en terreno y exigencia de respaldos para actividades críticas.',
    solution: 'SkillFlow AI permite registrar asistencia, evaluaciones y certificados asociados a sesiones.',
    benefit: 'Evidencia ordenada para contratistas, mandantes y auditorías internas.',
  },
  {
    title: 'Servicios',
    icon: Building2,
    problem: 'Capacitaciones transversales difíciles de medir y reportar a gerencias.',
    solution: 'Dashboard ejecutivo, catálogo de cursos y seguimiento de avance por colaborador.',
    benefit: 'Mayor trazabilidad del desarrollo de talento y cumplimiento interno.',
  },
  {
    title: 'Retail',
    icon: ShoppingBag,
    problem: 'Capacitación masiva, sucursales distribuidas y necesidad de estandarizar inducciones.',
    solution: 'SkillFlow AI organiza cursos, sesiones, asistencia y evaluación de participantes.',
    benefit: 'Escalabilidad para formación continua con evidencia digital centralizada.',
  },
  {
    title: 'OTEC',
    icon: UsersRound,
    problem: 'Gestión operativa de cursos, participantes, asistencia, certificados y evidencias SENCE.',
    solution: 'La plataforma ofrece un flujo SaaS para administrar capacitación y readiness documental.',
    benefit: 'Mejor experiencia comercial para clientes empresa y mayor eficiencia operativa.',
  },
] as const;

export default function UseCasesPage() {
  return (
    <PublicSiteShell>
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex rounded-full border bg-card px-3 py-1 text-sm font-medium text-primary shadow-sm">
            Casos por industria
          </div>
          <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">Casos de Uso</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            SkillFlow AI está diseñado para organizaciones que necesitan gestionar capacitación, evidencia y cumplimiento con trazabilidad comercialmente presentable.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {useCases.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <Card key={useCase.title} className="p-5">
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h2 className="mt-4 text-xl font-semibold tracking-normal">{useCase.title}</h2>
                <div className="mt-5 space-y-4">
                  <UseCaseBlock label="Problema" text={useCase.problem} />
                  <UseCaseBlock label="Solución SkillFlow AI" text={useCase.solution} />
                  <UseCaseBlock label="Beneficio esperado" text={useCase.benefit} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </PublicSiteShell>
  );
}

function UseCaseBlock({ label, text }: Readonly<{ label: string; text: string }>) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-primary">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
