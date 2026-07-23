import { AppShell } from '@/components/layout/app-shell';

export default function OtecComplianceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
