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
  certificates: {
    lists: () => ['certificates'] as const,
    list: (filters: object) => ['certificates', filters] as const,
  },
  sence: {
    declarations: (filters: object) => ['sence', 'declarations', filters] as const,
  },
};
