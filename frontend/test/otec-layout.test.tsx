import { render, screen } from '@testing-library/react';

import OtecComplianceLayout from '@/app/otec-compliance/layout';
import OtecProfilePage from '@/app/otec-compliance/profile/page';

vi.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children }: Readonly<{ children: React.ReactNode }>) => (
    <div data-testid="authenticated-app-shell">{children}</div>
  ),
}));

vi.mock('@/features/otec-compliance/profile/otec-profile-page-content', () => ({
  OtecProfilePageContent: () => <div>OTEC profile content</div>,
}));

describe('OTEC Compliance route layout', () => {
  it('uses one shared authenticated shell for OTEC Compliance pages', () => {
    render(<OtecComplianceLayout><OtecProfilePage /></OtecComplianceLayout>);

    expect(screen.getAllByTestId('authenticated-app-shell')).toHaveLength(1);
    expect(screen.getByText('OTEC profile content')).toBeInTheDocument();
  });
});
