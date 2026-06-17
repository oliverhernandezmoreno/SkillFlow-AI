'use client';

import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ActionMenuProps {
  onEdit?: () => void;
}

export function ActionMenu({ onEdit }: Readonly<ActionMenuProps>) {
  return (
    <Button variant="ghost" size="icon" aria-label="Edit row" onClick={onEdit}>
      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
