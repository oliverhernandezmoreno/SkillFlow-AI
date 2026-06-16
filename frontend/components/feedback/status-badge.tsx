import { Badge } from '@/components/ui/badge';

const statusVariantMap = {
  Active: 'emerald',
  Published: 'emerald',
  Approved: 'emerald',
  Completed: 'emerald',
  Ready: 'cyan',
  Scheduled: 'cyan',
  Draft: 'muted',
  Pending: 'amber',
  Warning: 'amber',
  Critical: 'rose',
  Rejected: 'rose',
} as const;

export function StatusBadge({ status }: Readonly<{ status: keyof typeof statusVariantMap | string }>) {
  const variant = status in statusVariantMap ? statusVariantMap[status as keyof typeof statusVariantMap] : 'default';
  return <Badge variant={variant}>{status}</Badge>;
}
