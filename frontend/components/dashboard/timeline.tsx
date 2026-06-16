import { StatusBadge } from '@/components/feedback/status-badge';

interface TimelineItem {
  title: string;
  time: string;
  status: string;
}

export function Timeline({ items }: Readonly<{ items: TimelineItem[] }>) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={`${item.title}-${item.time}`} className="flex gap-3">
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/10" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{item.title}</p>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-sm text-muted-foreground">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
