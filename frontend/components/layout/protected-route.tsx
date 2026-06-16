'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { useAuthStore } from '@/stores/auth-store';

export function ProtectedRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, hasHydrated, isSessionLoading } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isSessionLoading && !accessToken) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [accessToken, hasHydrated, isSessionLoading, pathname, router]);

  if (!hasHydrated || isSessionLoading || !accessToken) {
    return (
      <main className="min-h-screen p-6">
        <LoadingSkeleton />
      </main>
    );
  }

  return children;
}
