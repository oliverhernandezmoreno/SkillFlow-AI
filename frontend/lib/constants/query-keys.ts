export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  employees: {
    lists: () => ['employees'] as const,
    list: (filters: object) => ['employees', filters] as const,
  },
  courses: {
    lists: () => ['courses'] as const,
    list: (filters: object) => ['courses', filters] as const,
  },
  trainingSessions: {
    lists: () => ['training-sessions'] as const,
    list: (filters: object) => ['training-sessions', filters] as const,
  },
  enrollments: {
    lists: () => ['enrollments'] as const,
    list: (filters: object) => ['enrollments', filters] as const,
  },
  attendance: {
    lists: () => ['attendance'] as const,
    list: (filters: object) => ['attendance', filters] as const,
  },
  evaluations: {
    lists: () => ['evaluations'] as const,
    list: (filters: object) => ['evaluations', filters] as const,
  },
  certificates: {
    lists: () => ['certificates'] as const,
    list: (filters: object) => ['certificates', filters] as const,
  },
  trainingPlans: {
    lists: () => ['training-plans'] as const,
    list: (filters: object) => ['training-plans', filters] as const,
  },
  sence: {
    lists: () => ['sence', 'declarations'] as const,
    declarations: (filters: object) => ['sence', 'declarations', filters] as const,
  },
  otecCompliance: {
    profile: () => ['otec-compliance', 'profile'] as const,
    accreditations: {
      lists: () => ['otec-compliance', 'accreditations'] as const,
      list: (filters: object) => ['otec-compliance', 'accreditations', filters] as const,
      detail: (id: string) => ['otec-compliance', 'accreditations', id] as const,
    },
    certifications: {
      lists: () => ['otec-compliance', 'quality-certifications'] as const,
      list: (filters: object) => ['otec-compliance', 'quality-certifications', filters] as const,
      detail: (id: string) => ['otec-compliance', 'quality-certifications', id] as const,
    },
    offices: {
      lists: () => ['otec-compliance', 'offices'] as const,
      list: (filters: object) => ['otec-compliance', 'offices', filters] as const,
      detail: (id: string) => ['otec-compliance', 'offices', id] as const,
    },
    representatives: {
      lists: () => ['otec-compliance', 'legal-representatives'] as const,
      list: (filters: object) => ['otec-compliance', 'legal-representatives', filters] as const,
      detail: (id: string) => ['otec-compliance', 'legal-representatives', id] as const,
    },
    resolutions: { lists: () => ['otec-compliance','resolutions'] as const, list: (filters: object) => ['otec-compliance','resolutions',filters] as const, detail: (id:string) => ['otec-compliance','resolutions',id] as const },
    readiness: { dashboard: (profileId:string) => ['otec-compliance','readiness',profileId] as const },
  },
};
