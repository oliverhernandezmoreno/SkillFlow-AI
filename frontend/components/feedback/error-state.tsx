import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({
  title = 'No se pudieron cargar los datos',
  description = 'La solicitud al backend falló. Intenta nuevamente o verifica la sesión.',
  actionLabel = 'Reintentar',
  onAction,
}: Readonly<ErrorStateProps>) {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="rounded-lg border bg-rose-50 p-3 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {onAction ? (
        <Button variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  );
}
