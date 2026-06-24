import type { LucideIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';

export interface SalesCardItem {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function SalesSection({
  title,
  description,
  items,
  columns = 3,
}: Readonly<{
  title: string;
  description?: string;
  items: SalesCardItem[];
  columns?: 2 | 3;
}>) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-normal">{title}</h2>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className={columns === 2 ? 'mt-6 grid gap-4 md:grid-cols-2' : 'mt-6 grid gap-4 md:grid-cols-3'}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="p-5">
              {Icon ? <Icon className="h-5 w-5 text-primary" aria-hidden="true" /> : null}
              <h3 className="mt-4 text-base font-semibold tracking-normal">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
