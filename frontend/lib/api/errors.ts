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
      return 'Tu sesión expiró. Vuelve a ingresar.';
    }
    if (error.status === 403) {
      return 'No tienes permisos para realizar esta acción.';
    }
    if (error.status >= 500) {
      return 'El backend no pudo completar la solicitud. Intenta nuevamente.';
    }

    return error.message;
  }

  if (error instanceof TypeError) {
    return 'El backend no está disponible. Verifica que la API esté funcionando.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Error inesperado. Intenta nuevamente.';
}
