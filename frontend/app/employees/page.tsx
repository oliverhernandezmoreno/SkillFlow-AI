import { AppShell } from '@/components/layout/app-shell';
import { EmployeesPageContent } from '@/features/employees/employees-page-content';

export default function EmployeesPage() {
  return (
    <AppShell>
      <EmployeesPageContent />
    </AppShell>
  );
}
