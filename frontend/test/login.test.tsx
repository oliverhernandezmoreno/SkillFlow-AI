import { render, screen } from '@testing-library/react';

import LoginPage from '@/app/login/page';
import { ToastProvider } from '@/components/feedback/toast-provider';

describe('Login form', () => {
  it('renders the demo login controls', () => {
    render(
      <ToastProvider>
        <LoginPage />
      </ToastProvider>,
    );

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
