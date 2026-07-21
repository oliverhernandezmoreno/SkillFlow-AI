'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

const links = [
  { href: '/otec-compliance/profile', label: 'Perfil', feature: 'profile' },
  { href: '/otec-compliance/accreditations', label: 'Acreditaciones', feature: 'accreditations' },
  { href: '/otec-compliance/quality-certifications', label: 'Certificaciones de Calidad', feature: 'certifications' },
  { href: '/otec-compliance/offices', label: 'Oficinas', feature: 'offices' },
  { href: '/otec-compliance/legal-representatives', label: 'Representantes Legales', feature: 'representatives' },
  { href: '/otec-compliance/resolutions', label: 'Resoluciones', feature: 'resolutions' },
  { href: '/otec-compliance/readiness', label: 'Readiness', feature: 'readiness' },
] as const;
const EMPTY_PERMISSIONS: string[] = [];
export function OtecNavigation() {
  const pathname = usePathname();
  const permissions = useAuthStore((state) => state.user?.permissions ?? EMPTY_PERMISSIONS);
  if (!permissions.includes('otec_compliance.read')) return null;
  return <nav aria-label="Navegación OTEC Compliance" className="flex gap-2 overflow-x-auto border-b pb-2">{links.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined} className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pathname === link.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>{link.label}</Link>)}</nav>;
}
