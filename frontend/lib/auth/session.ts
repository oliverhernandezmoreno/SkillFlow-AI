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

  useAuthStore.getState().setSession(response);
  return response.user;
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
