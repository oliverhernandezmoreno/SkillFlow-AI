import { render, screen } from '@testing-library/react';

import { DemoChecklist } from '@/components/demo/demo-checklist';

describe('DemoChecklist', () => {
  it('renders the suggested demo flow in Spanish', () => {
    render(<DemoChecklist hasBackendError={false} />);

    expect(screen.getByText(/flujo demo sugerido/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /validar cumplimiento sence/i })).toBeInTheDocument();
  });
});
