'use client';

import { Bell, Command, LogOut, Menu, Moon, Search, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/auth/session';
import { useAuthStore } from '@/stores/auth-store';

export function Topbar({ onOpenMenu }: Readonly<{ onOpenMenu: () => void }>) {
  const { setTheme, theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const initials = user ? `${user.firstName[0] ?? 'S'}${user.lastName[0] ?? 'F'}` : 'SF';

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label="Open navigation">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground md:flex">
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="truncate">Search employees, courses, certificates...</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs">
            <Command className="h-3 w-3" aria-hidden="true" /> K
          </span>
        </div>
        <Button variant="ghost" size="icon" aria-label="Open notifications">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 dark:hidden" aria-hidden="true" />
          <Moon className="hidden h-5 w-5 dark:block" aria-hidden="true" />
        </Button>
        <div className="flex items-center gap-3 rounded-lg border bg-card px-2 py-1.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{user ? `${user.firstName} ${user.lastName}` : 'Demo Admin'}</p>
            <p className="text-xs text-muted-foreground">HR Operations</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Logout" onClick={() => void logout()}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  );
}
