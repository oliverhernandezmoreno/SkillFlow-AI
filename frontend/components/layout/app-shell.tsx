'use client';

import { useState } from 'react';

import { ProtectedRoute } from '@/components/layout/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { DemoModeBanner } from '@/components/demo/demo-mode-banner';

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-background/90 lg:block">
          <Sidebar />
        </div>

        {isMobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              className="absolute inset-0 bg-slate-950/40"
              aria-label="Cerrar navegación"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="relative h-full w-[min(20rem,86vw)] border-r bg-background shadow-soft">
              <div className="absolute right-3 top-3">
                <Button variant="ghost" size="sm" onClick={() => setIsMobileOpen(false)}>
                  Cerrar
                </Button>
              </div>
              <Sidebar onNavigate={() => setIsMobileOpen(false)} />
            </div>
          </div>
        ) : null}

        <div className="min-w-0">
          <Topbar onOpenMenu={() => setIsMobileOpen(true)} />
          <main className="mx-auto w-full max-w-7xl space-y-6 p-3 sm:p-6 lg:p-8">
            <DemoModeBanner />
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
