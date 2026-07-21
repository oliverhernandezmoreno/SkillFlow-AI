'use client';

import { useAuthStore } from '@/stores/auth-store';
import type { ApiErrorPayload, ApiRequestOptions, ApiResponseMetadata, TokenResponse } from '@/types/api';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload: ApiErrorPayload | null,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const response = await sendRequest(path, options);

  if (response.status === 401 && !options.skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryResponse = await sendRequest(path, options);
      return parseResponse<TResponse>(retryResponse);
    }

    useAuthStore.getState().logout();
  }

  return parseResponse<TResponse>(response);
}

export async function apiRequestWithMetadata<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponseMetadata<TResponse>> {
  let response = await sendRequest(path, options);

  if (response.status === 401 && !options.skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await sendRequest(path, options);
    } else {
      useAuthStore.getState().logout();
    }
  }

  return {
    data: await parseResponse<TResponse>(response),
    etag: response.headers.get('ETag'),
  };
}

async function sendRequest(path: string, options: ApiRequestOptions): Promise<Response> {
  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !options.skipAuth) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

async function parseResponse<TResponse>(response: Response): Promise<TResponse> {
  if (response.status === 204) {
    return undefined as TResponse;
  }

  const payload = (await response.json().catch(() => null)) as TResponse | ApiErrorPayload | null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null;
    throw new ApiClientError(
      errorPayload?.message ?? `Request failed with status ${response.status}`,
      response.status,
      errorPayload,
    );
  }

  return payload as TResponse;
}

async function refreshAccessToken(): Promise<boolean> {
  const { refreshToken, setSession, user } = useAuthStore.getState();
  if (!refreshToken || !user) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const tokens = (await response.json()) as TokenResponse;
    setSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user });
    return true;
  } catch {
    return false;
  }
}
