'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Activity, RotateCcw, ShieldCheck } from 'lucide-react';

import { DemoChecklist } from '@/components/demo/demo-checklist';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api/client';
import { demoAccount } from '@/lib/constants/demo-account';
import { cn } from '@/lib/utils/cn';

function getHealthUrl() {
  const apiUrl = new URL(API_BASE_URL);
  return `${apiUrl.origin}/health`;
}

export function DemoModeBanner() {
  const backendHealth = useQuery({
    queryKey: ['backend-health'],
    queryFn: async () => {
      const response = await fetch(getHealthUrl(), { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Backend health check failed');
      }
      return response.json() as Promise<{ status: string }>;
    },
    retry: 1,
    refetchInterval: 30000,
  });

  const isConnected = backendHealth.data?.status === 'ok';
  const hasBackendError = backendHealth.isError;

  return (
    <section className="rounded-lg border bg-card p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Demo environment active
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-semibold',
                isConnected
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : hasBackendError
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
              )}
            >
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              {isConnected ? 'Backend connected' : hasBackendError ? 'Backend unavailable' : 'Checking backend'}
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground">Demo user: {demoAccount.email}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild size="sm">
            <Link href="/dashboard">Go to demo flow</Link>
          </Button>
          <Button size="sm" variant="outline" disabled title="No demo reset endpoint is available yet">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset demo data
          </Button>
        </div>
      </div>
      <div className="mt-3">
        <DemoChecklist hasBackendError={hasBackendError} />
      </div>
    </section>
  );
}
