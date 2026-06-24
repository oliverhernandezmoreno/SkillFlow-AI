import { Bot, CheckCircle2, FileCheck2, Fingerprint, Medal, ShieldCheck, Sparkles, Target } from 'lucide-react';
import Link from 'next/link';

import { PublicSiteShell } from '@/components/marketing/public-site-shell';
import { SalesSection } from '@/components/marketing/sales-section';
import { Button } from '@/components/ui/button';

const sections = [
  {
    title: 'Problema',
    description: 'Las empresas gestionan capacitación, asistencia, certificados y evidencia SENCE en planillas, correos y sistemas aislados. Eso reduce visibilidad ejecutiva y aumenta el riesgo operativo.',
    icon: Target,
  },
  {
    title: 'Solución',
    description: 'SkillFlow AI centraliza el ciclo de capacitación: colaboradores, cursos, sesiones, asistencia, evaluaciones, certificados y preparación de evidencias SENCE.',
    icon: Sparkles,
  },
  {
    title: 'Beneficios',
    description: 'Más control para RRHH, mejor trazabilidad para operaciones, evidencia lista para auditorías y una demo SaaS clara para pilotos empresariales.',
    icon: CheckCircle2,
  },
  {
    title: 'Cumplimiento SENCE',
    description: 'El producto ordena el readiness de evidencia SENCE sin prometer envío oficial automático ni integración externa en esta etapa.',
    icon: FileCheck2,
  },
  {
    title: 'Trazabilidad',
    description: 'Flujos conectados desde inscripción hasta asistencia, evaluación, certificado y declaración, con señales visibles de auditoría.',
    icon: Fingerprint,
  },
  {
    title: 'Certificación Digital',
    description: 'Certificados visuales con número, código de verificación, persona, curso, organización y estado de emisión.',
    icon: Medal,
  },
  {
    title: 'Roadmap IA',
    description: 'La visión considera detección de brechas, recomendaciones de capacitación y Copilot RRHH, sin activar IA real en la demo actual.',
    icon: Bot,
  },
  {
    title: 'Contacto Demo',
    description: 'Disponible para reuniones comerciales, pilotos empresariales, OTEC, OTIC, Start-Up Chile e inversionistas Seed.',
    icon: ShieldCheck,
  },
] as const;

export default function AboutPage() {
  return (
    <PublicSiteShell>
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex rounded-full border bg-card px-3 py-1 text-sm font-medium text-primary shadow-sm">
            SaaS HRTech comercialmente listo para pilotos
          </div>
          <h1 className="text-5xl font-semibold tracking-normal text-foreground sm:text-6xl">SkillFlow AI</h1>
          <p className="mt-5 text-xl text-muted-foreground">
            La plataforma inteligente para gestionar capacitación, cumplimiento y talento.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/demo">Ver Demo Comercial</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/pricing">Solicitar Cotización</Link>
            </Button>
          </div>
        </div>
      </section>
      <SalesSection title="Sobre la plataforma" description="Narrativa comercial para clientes, OTEC, OTIC e inversionistas." items={[...sections]} columns={2} />
    </PublicSiteShell>
  );
}
