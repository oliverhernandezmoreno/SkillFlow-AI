import { render, screen } from '@testing-library/react';
import { Award } from 'lucide-react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { StatusBadge } from '@/components/feedback/status-badge';

describe('Feedback components', () => {
  it('renders ErrorState content', () => {
    render(<ErrorState title="Backend unavailable" description="Start the API and retry." />);

    expect(screen.getByText(/backend unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/start the api and retry/i)).toBeInTheDocument();
  });

  it('renders StatusBadge content', () => {
    render(<StatusBadge status="READY" />);

    expect(screen.getByText('Listo')).toBeInTheDocument();
  });

  it('renders EmptyState content', () => {
    render(<EmptyState icon={Award} title="No certificates" description="Issue one after completion." />);

    expect(screen.getByText(/no certificates/i)).toBeInTheDocument();
  });
});
