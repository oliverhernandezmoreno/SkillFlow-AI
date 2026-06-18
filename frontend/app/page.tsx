import { ArrowRight, Award, BookOpenCheck, FileCheck2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const benefits = [
  {
    title: 'Gestión integral de capacitación',
    description: 'Centraliza colaboradores, cursos, planes, sesiones e inscripciones en un flujo operativo claro.',
    icon: BookOpenCheck,
  },
  {
    title: 'Cumplimiento y trazabilidad SENCE',
    description: 'Ordena evidencia, estados y preparación de declaraciones para equipos de RRHH y OTEC.',
    icon: FileCheck2,
  },
  {
    title: 'Certificación y evidencia digital',
    description: 'Conecta asistencia, evaluaciones y certificados para demostrar avances con datos verificables.',
    icon: Award,
  },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl content-center gap-10">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center rounded-full border bg-card px-3 py-1 text-sm font-medium text-primary shadow-sm">
            SaaS HRTech para Chile y LatAm
          </div>
          <h1 className="text-5xl font-semibold tracking-normal text-foreground sm:text-6xl">SkillFlow AI</h1>
          <p className="mt-5 max-w-2xl text-xl text-muted-foreground">
            La plataforma inteligente para gestionar capacitación, cumplimiento y talento.
          </p>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Capacitación, cumplimiento SENCE y certificación en una sola plataforma SaaS.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="h-11 px-5">
              <Link href="/login">
                Ingresar a la demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card key={benefit.title} className="p-5">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="mt-4 text-base font-semibold tracking-normal">{benefit.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{benefit.description}</p>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
