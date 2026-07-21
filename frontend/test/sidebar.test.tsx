import { render, screen } from '@testing-library/react';

import { Sidebar } from '@/components/layout/sidebar';
import { otecCompliancePermissions } from '@/lib/constants/navigation';
import { useAuthStore } from '@/stores/auth-store';

const demoUser = {
  id: 'user-id',
  organizationId: 'organization-id',
  email: 'admin@skillflow.demo',
  firstName: 'Demo',
  lastName: 'Admin',
};

describe('Sidebar OTEC Compliance navigation', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null });
  });

  it.each(otecCompliancePermissions)(
    'shows OTEC Compliance for the real permission %s',
    (permission) => {
      useAuthStore.setState({ user: { ...demoUser, permissions: [permission] } });

      render(<Sidebar />);

      expect(screen.getByRole('link', { name: /otec compliance/i })).toHaveAttribute(
        'href',
        '/otec-compliance/profile',
      );
    },
  );

  it('hides OTEC Compliance when the user has no OTEC permission', () => {
    useAuthStore.setState({ user: { ...demoUser, permissions: ['courses.read'] } });

    render(<Sidebar />);

    expect(screen.queryByRole('link', { name: /otec compliance/i })).not.toBeInTheDocument();
  });
});
