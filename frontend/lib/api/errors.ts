import { ApiClientError } from '@/lib/api/client';

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    const payloadMessage = error.payload?.message;
    if (payloadMessage) {
      return payloadMessage;
    }

    const nestedMessage = (error.payload as { error?: { message?: string } } | null)?.error?.message;
    if (nestedMessage) {
      return nestedMessage;
    }

    if (error.status === 401) {
      return 'Your session expired. Please sign in again.';
    }
    if (error.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.status >= 500) {
      return 'The backend could not complete the request. Please try again.';
    }

    return error.message;
  }

  if (error instanceof TypeError) {
    return 'Backend is not available. Check that the API is running.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error. Please try again.';
}
