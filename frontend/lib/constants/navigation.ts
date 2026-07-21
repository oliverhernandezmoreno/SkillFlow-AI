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
  { title: 'OTEC Compliance', href: '/otec-compliance/profile', icon: ShieldCheck, permission: 'otec_compliance.read' },
  { title: 'Configuración', href: '/settings', icon: Settings },
] as const;

export const workspaceSummary = {
  organization: 'Minera Andes Capacitación',
  plan: 'Demo Comercial 2026',
  complianceStatus: 'PAC 84% en cumplimiento',
  icon: ShieldCheck,
};
