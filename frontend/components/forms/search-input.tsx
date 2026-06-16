import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';

export function SearchInput({ placeholder = 'Search records...' }: Readonly<{ placeholder?: string }>) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="pl-9" placeholder={placeholder} />
    </label>
  );
}
