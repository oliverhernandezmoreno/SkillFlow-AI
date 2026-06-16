import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  icon?: LucideIcon;
}

export function PageHeader({ title, description, actionLabel, icon: Icon }: Readonly<PageHeaderProps>) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        {Icon ? (
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        ) : null}
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {actionLabel ? <Button className="w-full sm:w-auto">{actionLabel}</Button> : null}
    </div>
  );
}
