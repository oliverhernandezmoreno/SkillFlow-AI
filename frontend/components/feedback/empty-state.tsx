import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel }: Readonly<EmptyStateProps>) {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="rounded-lg border bg-muted p-3">
        <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel ? <Button variant="outline">{actionLabel}</Button> : null}
    </Card>
  );
}
