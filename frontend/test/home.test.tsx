import { render, screen } from '@testing-library/react';

import HomePage from '@/app/page';

describe('HomePage', () => {
  it('renders the Spanish commercial landing page', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: /skillflow ai/i })).toBeInTheDocument();
    expect(screen.getByText(/la plataforma inteligente/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ingresar a la demo/i })).toHaveAttribute('href', '/login');
  });
});
