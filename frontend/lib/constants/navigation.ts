import {
  Award,
  BarChart3,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';

export const otecCompliancePermissions = [
  'otec_compliance.read',
  'otec_compliance.profile.manage',
  'otec_compliance.accreditation.manage',
  'otec_compliance.certification.manage',
  'otec_compliance.office.manage',
  'otec_compliance.representative.manage',
  'otec_compliance.resolution.manage',
  'otec_compliance.readiness.evaluate',
] as const;

export const navigationItems = [
  { title: 'Panel de Control', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Colaboradores', href: '/employees', icon: Users },
  { title: 'Cursos', href: '/courses', icon: BookOpen },
  { title: 'Planes de Capacitación', href: '/training-plans', icon: BarChart3 },
  { title: 'Sesiones', href: '/training-sessions', icon: GraduationCap },
  { title: 'Inscripciones', href: '/enrollments', icon: ListChecks },
  { title: 'Asistencia', href: '/attendance', icon: CalendarCheck },
  { title: 'Evaluaciones', href: '/evaluations', icon: ClipboardCheck },
  { title: 'Certificados', href: '/certificates', icon: Award },
  { title: 'SENCE', href: '/sence', icon: FileCheck2 },
  {
    title: 'OTEC Compliance',
    href: '/otec-compliance/profile',
    icon: ShieldCheck,
    requiredAnyPermissions: otecCompliancePermissions,
  },
  { title: 'Configuración', href: '/settings', icon: Settings },
] as const;

export const workspaceSummary = {
  organization: 'Minera Andes Capacitación',
  plan: 'Demo Comercial 2026',
  complianceStatus: 'PAC 84% en cumplimiento',
  icon: ShieldCheck,
};
