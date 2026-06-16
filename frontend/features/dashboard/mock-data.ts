import {
  Award,
  BarChart3,
  CalendarCheck,
  FileCheck2,
  GraduationCap,
  ShieldAlert,
  Users,
  ClipboardCheck,
} from 'lucide-react';

export const executiveStats = [
  {
    title: 'Active trainings',
    value: '18',
    change: '+12% versus last month',
    tone: 'indigo',
    icon: GraduationCap,
  },
  {
    title: 'Enrolled participants',
    value: '642',
    change: '84 seats open this week',
    tone: 'cyan',
    icon: Users,
  },
  {
    title: 'Average attendance',
    value: '91%',
    change: '+4.3 points quarter to date',
    tone: 'emerald',
    icon: CalendarCheck,
  },
  {
    title: 'Evaluations passed',
    value: '87%',
    change: '34 pending reviews',
    tone: 'amber',
    icon: ClipboardCheck,
  },
  {
    title: 'Certificates issued',
    value: '428',
    change: '52 generated today',
    tone: 'slate',
    icon: Award,
  },
  {
    title: 'SENCE ready',
    value: '24',
    change: '6 declarations need evidence',
    tone: 'cyan',
    icon: FileCheck2,
  },
  {
    title: 'PAC compliance',
    value: '84%',
    change: 'On track for Q3',
    tone: 'emerald',
    icon: BarChart3,
  },
  {
    title: 'Critical alerts',
    value: '3',
    change: 'Attendance anomalies detected',
    tone: 'rose',
    icon: ShieldAlert,
  },
] as const;

export const attendanceTrend = [
  { name: 'Jan', attendance: 82 },
  { name: 'Feb', attendance: 86 },
  { name: 'Mar', attendance: 88 },
  { name: 'Apr', attendance: 91 },
  { name: 'May', attendance: 89 },
  { name: 'Jun', attendance: 94 },
];

export const complianceTrend = [
  { name: 'Operations', compliance: 88 },
  { name: 'Safety', compliance: 94 },
  { name: 'HR', compliance: 82 },
  { name: 'Finance', compliance: 76 },
  { name: 'Field', compliance: 85 },
];

export const timelineItems = [
  { title: 'Operational Safety Essentials', time: 'Today, 09:30', status: 'Active' },
  { title: 'Leadership for Shift Leads', time: 'Tomorrow, 11:00', status: 'Scheduled' },
  { title: 'SENCE evidence review', time: 'Friday, 15:00', status: 'Ready' },
  { title: 'Certificate batch release', time: 'Next Monday', status: 'Pending' },
];

export const upcomingSessions = [
  {
    name: 'Operational Safety Essentials',
    owner: 'Camila Torres',
    date: 'Jul 15, 2026',
    seats: '18 / 24',
    status: 'Published',
  },
  {
    name: 'Equipment Lockout Protocol',
    owner: 'Diego Silva',
    date: 'Jul 18, 2026',
    seats: '12 / 20',
    status: 'Scheduled',
  },
  {
    name: 'SENCE Compliance Workshop',
    owner: 'Valentina Rojas',
    date: 'Jul 22, 2026',
    seats: '30 / 30',
    status: 'Ready',
  },
];

export const resourceRows = {
  employees: [
    { name: 'Camila Torres', area: 'Operations', metric: '3 active enrollments', status: 'Active' },
    { name: 'Diego Silva', area: 'Safety', metric: '2 certificates', status: 'Active' },
    { name: 'Valentina Rojas', area: 'People', metric: '1 pending evaluation', status: 'Pending' },
  ],
  courses: [
    { name: 'Operational Safety Essentials', area: 'Safety', metric: '8 hours', status: 'Active' },
    { name: 'Leadership for Shift Leads', area: 'Operations', metric: '12 hours', status: 'Draft' },
    { name: 'SENCE Evidence Handling', area: 'Compliance', metric: '4 hours', status: 'Active' },
  ],
  trainingPlans: [
    { name: 'Annual Training Plan 2026', area: 'Corporate', metric: '84% compliance', status: 'Approved' },
    { name: 'Field Safety PAC', area: 'Operations', metric: '71% compliance', status: 'Warning' },
    { name: 'Leadership Upskilling', area: 'People', metric: 'Draft budget', status: 'Draft' },
  ],
  sessions: [
    { name: 'Safety Essentials - July', area: 'Room A', metric: '24 seats', status: 'Published' },
    { name: 'Leadership Sprint', area: 'Remote', metric: '18 seats', status: 'Scheduled' },
    { name: 'Compliance Evidence Lab', area: 'Room B', metric: '30 seats', status: 'Ready' },
  ],
  enrollments: [
    { name: 'Camila Torres', area: 'Safety Essentials', metric: 'Confirmed', status: 'Approved' },
    { name: 'Diego Silva', area: 'Lockout Protocol', metric: 'Pending manager', status: 'Pending' },
    { name: 'Valentina Rojas', area: 'Evidence Lab', metric: 'Waitlist', status: 'Warning' },
  ],
  attendance: [
    { name: 'Safety Essentials', area: 'Jul 15', metric: '91% attendance', status: 'Completed' },
    { name: 'Leadership Sprint', area: 'Jul 18', metric: '82% attendance', status: 'Warning' },
    { name: 'Evidence Lab', area: 'Jul 22', metric: 'Ready for QR', status: 'Ready' },
  ],
  evaluations: [
    { name: 'Safety Final Test', area: 'Knowledge', metric: '87% passed', status: 'Completed' },
    { name: 'Leadership Survey', area: 'Satisfaction', metric: '14 responses', status: 'Active' },
    { name: 'Evidence Practical', area: 'Practical', metric: 'Pending close', status: 'Pending' },
  ],
  certificates: [
    { name: 'CERT-2026-00428', area: 'Safety Essentials', metric: 'Issued today', status: 'Completed' },
    { name: 'CERT-2026-00429', area: 'Lockout Protocol', metric: 'Eligibility review', status: 'Pending' },
    { name: 'CERT-2026-00430', area: 'Evidence Lab', metric: 'Ready to generate', status: 'Ready' },
  ],
  sence: [
    { name: 'SENCE-DEMO-001', area: 'Safety Essentials', metric: '$600K credit', status: 'Ready' },
    { name: 'SENCE-DEMO-002', area: 'Lockout Protocol', metric: 'Missing evidence', status: 'Warning' },
    { name: 'SENCE-DEMO-003', area: 'Evidence Lab', metric: 'Draft declaration', status: 'Draft' },
  ],
};
