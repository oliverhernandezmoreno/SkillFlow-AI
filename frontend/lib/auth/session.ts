'use client';

import { apiRequest } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthResponse, UserProfile } from '@/types/api';

export async function login(input: { email: string; password: string }) {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
    skipAuth: true,
  });

  const user = { ...response.user, permissions: readTokenPermissions(response.accessToken) };
  useAuthStore.getState().setSession({ ...response, user });
  return user;
}

export function readTokenPermissions(accessToken: string): string[] {
  try {
    const encodedPayload = accessToken.split('.')[1];
    if (!encodedPayload) return [];
    const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'))) as { permissions?: unknown };
    return Array.isArray(payload.permissions)
      ? payload.permissions.filter((permission): permission is string => typeof permission === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function loadCurrentUser() {
  const user = await apiRequest<UserProfile>('/auth/me');
  useAuthStore.getState().setUser(user);
  return user;
}

export async function logout() {
  try {
    await apiRequest<void>('/auth/logout', { method: 'POST' });
  } finally {
    useAuthStore.getState().logout();
  }
}

export async function forgotPassword(email: string) {
  await apiRequest<void>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    skipAuth: true,
  });
}

export async function resetPassword(token: string, password: string) {
  if (!token) {
    throw new Error('Se requiere un token de recuperación.');
  }

  await apiRequest<void>('/auth/reset-password', {
    method: 'POST',
    body: { token, password },
    skipAuth: true,
  });
}
