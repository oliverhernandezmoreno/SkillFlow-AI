'use client';

import { getErrorMessage } from '@/lib/api/errors';
import { useToast } from '@/components/feedback/toast-provider';

export function useApiErrorToast() {
  const { showToast } = useToast();

  return (error: unknown, title = 'Request failed') => {
    showToast({
      title,
      description: getErrorMessage(error),
      tone: 'error',
    });
  };
}
