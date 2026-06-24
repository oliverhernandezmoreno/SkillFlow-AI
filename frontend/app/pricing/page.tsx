import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { PublicSiteShell } from '@/components/marketing/public-site-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const plans = [
  {
    name: 'STARTER',
    audience: 'Para equipos que inician control formal de capacitación.',
    features: ['Hasta 100 colaboradores', 'Capacitación', 'Asistencia', 'Certificados'],
  },
  {
    name: 'BUSINESS',
    audience: 'Para empresas que requieren trazabilidad y cumplimiento.',
    features: ['Hasta 1.000 colaboradores', 'Dashboards', 'Cumplimiento', 'SENCE readiness'],
  },
  {
    name: 'ENTERPRISE',
    audience: 'Para organizaciones con necesidades avanzadas de seguridad e integración.',
    features: ['Usuarios ilimitados', 'SSO', 'APIs', 'Soporte dedicado'],
  },
] as const;

export default function PricingPage() {
  return (
    <PublicSiteShell>
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex rounded-full border bg-card px-3 py-1 text-sm font-medium text-primary shadow-sm">
            Planes iniciales
          </div>
          <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Planes comerciales pensados para pilotos, empresas medianas y despliegues enterprise. No mostramos precios públicos por ahora.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className="flex flex-col p-5">
              <h2 className="text-xl font-semibold tracking-normal">{plan.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{plan.audience}</p>
              <p className="mt-6 rounded-md border bg-muted/45 px-3 py-2 text-sm font-medium">Precio bajo cotización</p>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6">
                <Link href="/demo">Solicitar Cotización</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </PublicSiteShell>
  );
}
