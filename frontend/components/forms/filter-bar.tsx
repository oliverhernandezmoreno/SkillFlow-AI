import { SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatStatusOptions } from '@/lib/formatters/status';
import { SearchInput } from './search-input';

interface FilterBarProps {
  searchValue?: string;
  statusValue?: string;
  statusOptions?: string[];
  onSearchChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
}

export function FilterBar({
  searchValue,
  statusValue = '',
  statusOptions = [],
  onSearchChange,
  onStatusChange,
}: Readonly<FilterBarProps>) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center">
      <SearchInput value={searchValue} onChange={(event) => onSearchChange?.(event.target.value)} />
      <div className="flex gap-2">
        {statusOptions.length > 0 ? (
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={statusValue}
            onChange={(event) => onStatusChange?.(event.target.value)}
            aria-label="Filter by status"
          >
          <option value="">Todos los estados</option>
          {formatStatusOptions(statusOptions).map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
          </select>
        ) : null}
        <Button variant="outline" className="w-full sm:w-auto">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filtros
        </Button>
        <Button variant="outline" className="w-full sm:w-auto">
          Exportar
        </Button>
      </div>
    </div>
  );
}
