'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { queryKeys } from '@/lib/constants/query-keys';
import { OtecNavigation } from '../otec-navigation';
import { useActiveOtecProfileContext } from '../use-active-profile-context';
import { dashboard } from './services';
export function ReadinessPage() {
  const profile = useActiveOtecProfileContext();
  const q = useQuery({
    queryKey: queryKeys.otecCompliance.readiness.dashboard(profile.profileId ?? ''),
    queryFn: ({ signal }) => dashboard(profile.profileId!, signal),
    enabled: Boolean(profile.profileId),
    retry: false,
  });
  if (profile.query.isLoading || q.isLoading) return <LoadingSkeleton />;
  if (!profile.profileId)
    return (
      <ErrorState
        title="Perfil OTEC requerido"
        description="Crea o activa el perfil antes de evaluar readiness."
      />
    );
  if (q.error)
    return (
      <ErrorState description={(q.error as Error).message} onAction={() => void q.refetch()} />
    );
  const x = q.data!;
  const expired = (x.expiring.data as any[]).filter((i) => i.state === 'EXPIRED').length;
  const soon = (x.expiring.data as any[]).filter((i) => i.state === 'EXPIRING_SOON').length;
  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        Configuración / OTEC Compliance / Readiness
      </nav>
      <OtecNavigation />
      <PageHeader
        title="Compliance Readiness"
        description="Estado ejecutivo calculado exclusivamente por el backend."
        icon={ShieldCheck}
      />
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Cumplimiento</p>
            <p className="text-4xl font-bold">{Math.round(x.readiness.score)}%</p>
          </div>
          <StatusBadge status={x.readiness.status} />
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(x.counts).map(([k, v]) => (
          <Card key={k} className="p-4">
            <p className="text-sm capitalize text-muted-foreground">{k}</p>
            <p className="text-2xl font-bold">{v as number}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Vencidos</p>
          <p className="text-2xl font-bold">{expired}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Próximos a vencer</p>
          <p className="text-2xl font-bold">{soon}</p>
        </Card>
      </div>
      <Card className="p-5">
        <h2 className="font-semibold">Bloqueadores ({x.summary.blockingCount})</h2>
        <ul className="mt-3 space-y-2">
          {x.readiness.blockingIssues.map((i) => (
            <li key={i.code} className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>{i.message}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-5">
        <h2 className="font-semibold">Recomendaciones</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {[...x.readiness.blockingIssues, ...x.readiness.warnings].map((i) => (
            <li key={`${i.code}-${i.severity}`}>{i.remediation ?? i.message}</li>
          ))}
        </ul>
      </Card>
      <p className="text-sm text-muted-foreground">
        Evaluación interna basada en registros configurados; no representa validación oficial.
      </p>
    </div>
  );
}
