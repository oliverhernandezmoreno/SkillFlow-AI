import { Badge } from '@/components/ui/badge';
import { formatStatus, getStatusTone } from '@/lib/formatters/status';

export function StatusBadge({ status }: Readonly<{ status: string }>) {
  return <Badge variant={getStatusTone(status)}>{formatStatus(status)}</Badge>;
}
