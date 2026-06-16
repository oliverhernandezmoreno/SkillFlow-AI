import { SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SearchInput } from './search-input';

export function FilterBar() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center">
      <SearchInput />
      <div className="flex gap-2">
        <Button variant="outline" className="w-full sm:w-auto">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
        </Button>
        <Button variant="outline" className="w-full sm:w-auto">
          Export
        </Button>
      </div>
    </div>
  );
}
