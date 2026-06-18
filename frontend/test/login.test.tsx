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

    expect(screen.getByRole('heading', { name: /bienvenido nuevamente/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /usar demo/i })).toBeInTheDocument();
  });
});
