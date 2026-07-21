'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { navigationItems, workspaceSummary } from '@/lib/constants/navigation';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/stores/auth-store';

export function Sidebar({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  const pathname = usePathname();
  const WorkspaceIcon = workspaceSummary.icon;
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];

  return (
    <aside className="flex h-full flex-col gap-4 p-4">
      <Link href="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          SF
        </div>
        <div>
          <p className="font-semibold tracking-normal">SkillFlow AI</p>
          <p className="text-xs text-muted-foreground">Capacitación inteligente</p>
        </div>
      </Link>

      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2">
          <WorkspaceIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="text-sm font-medium">{workspaceSummary.organization}</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{workspaceSummary.complianceStatus}</p>
      </div>

      <nav className="grid gap-1" aria-label="Primary navigation">
        {navigationItems.filter((item) => !('permission' in item) || permissions.includes(item.permission)).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
