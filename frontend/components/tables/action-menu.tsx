'use client';

import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function ActionMenu() {
  return (
    <Button variant="ghost" size="icon" aria-label="Open row actions">
      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
