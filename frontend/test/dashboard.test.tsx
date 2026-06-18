import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { DashboardView } from '@/components/dashboard/dashboard-view';

vi.mock('@/hooks/use-dashboard-data', () => ({
  useDashboardData: () => {
    const emptyQuery = { data: { data: [], meta: { page: 1, pageSize: 100, total: 0, totalPages: 0 } } };
    return {
      employees: emptyQuery,
      courses: emptyQuery,
      trainingSessions: emptyQuery,
      enrollments: emptyQuery,
      attendance: emptyQuery,
      certificates: emptyQuery,
      evaluations: emptyQuery,
      senceDeclarations: emptyQuery,
      isLoading: false,
      isError: false,
    };
  },
}));

describe('Dashboard', () => {
  it('renders an empty state when backend data is empty', () => {
    render(<DashboardView />);

    expect(screen.getByRole('heading', { name: /panel ejecutivo/i })).toBeInTheDocument();
    expect(screen.getByText(/sin datos operativos todavía/i)).toBeInTheDocument();
  });
});
