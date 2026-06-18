import { render, screen } from '@testing-library/react';

import { DemoChecklist } from '@/components/demo/demo-checklist';

describe('DemoChecklist', () => {
  it('renders the suggested demo flow in Spanish', () => {
    render(<DemoChecklist hasBackendError={false} />);

    expect(screen.getByText(/ruta sugerida/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /panel ejecutivo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sence/i })).toBeInTheDocument();
  });
});
