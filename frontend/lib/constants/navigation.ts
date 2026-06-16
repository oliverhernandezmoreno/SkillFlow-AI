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
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Employees', href: '/employees', icon: Users },
  { title: 'Courses', href: '/courses', icon: BookOpen },
  { title: 'Training Plans', href: '/training-plans', icon: BarChart3 },
  { title: 'Training Sessions', href: '/training-sessions', icon: GraduationCap },
  { title: 'Enrollments', href: '/enrollments', icon: ListChecks },
  { title: 'Attendance', href: '/attendance', icon: CalendarCheck },
  { title: 'Evaluations', href: '/evaluations', icon: ClipboardCheck },
  { title: 'Certificates', href: '/certificates', icon: Award },
  { title: 'SENCE', href: '/sence', icon: FileCheck2 },
  { title: 'Settings', href: '/settings', icon: Settings },
] as const;

export const workspaceSummary = {
  organization: 'SkillFlow Demo',
  plan: 'Commercial Demo 2026',
  complianceStatus: 'PAC 84% compliant',
  icon: ShieldCheck,
};
