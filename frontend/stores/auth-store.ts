'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { UserProfile } from '@/types/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  hasHydrated: boolean;
  isSessionLoading: boolean;
  setSession: (input: { accessToken: string; refreshToken: string; user: UserProfile }) => void;
  setUser: (user: UserProfile | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setSessionLoading: (isSessionLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      isSessionLoading: false,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user, isSessionLoading: false }),
      setUser: (user) => set({ user }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setSessionLoading: (isSessionLoading) => set({ isSessionLoading }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isSessionLoading: false,
        }),
    }),
    {
      name: 'skillflow-auth-session',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setSessionLoading(false);
        state?.setHasHydrated(true);
      },
    },
  ),
);
