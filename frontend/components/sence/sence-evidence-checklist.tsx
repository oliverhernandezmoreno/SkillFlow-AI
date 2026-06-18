import { CheckCircle2, Circle, FileCheck2, TriangleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export type EvidenceStatus = 'complete' | 'pending' | 'observed';

export interface EvidenceChecklistItem {
  label: string;
  description: string;
  status: EvidenceStatus;
}

const statusConfig = {
  complete: {
    label: 'Completo',
    icon: CheckCircle2,
    variant: 'emerald' as const,
  },
  pending: {
    label: 'Pendiente',
    icon: Circle,
    variant: 'amber' as const,
  },
  observed: {
    label: 'Observado',
    icon: TriangleAlert,
    variant: 'rose' as const,
  },
};

export function SenceEvidenceChecklist({ items }: Readonly<{ items: EvidenceChecklistItem[] }>) {
  const completedItems = items.filter((item) => item.status === 'complete').length;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-semibold tracking-normal">Checklist de evidencia SENCE</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Flujo de preparación de evidencias para cumplimiento SENCE. No representa envío oficial automático a SENCE.
          </p>
        </div>
        <Badge variant="cyan">
          {completedItems}/{items.length} completos
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;

          return (
            <div key={item.label} className="rounded-md border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <Icon className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
