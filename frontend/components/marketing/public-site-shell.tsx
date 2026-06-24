import Link from 'next/link';

import { Button } from '@/components/ui/button';

const publicNavItems = [
  { label: 'Sobre', href: '/about' },
  { label: 'Demo', href: '/demo' },
  { label: 'Casos de Uso', href: '/use-cases' },
  { label: 'Roadmap', href: '/roadmap' },
  { label: 'Pricing', href: '/pricing' },
] as const;

export function PublicSiteShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              SF
            </div>
            <div>
              <p className="font-semibold tracking-normal">SkillFlow AI</p>
              <p className="text-xs text-muted-foreground">SaaS HRTech para Chile y LatAm</p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Navegación comercial">
            {publicNavItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                {item.label}
              </Link>
            ))}
            <Button asChild size="sm">
              <Link href="/login">Ingresar a la Demo</Link>
            </Button>
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}
