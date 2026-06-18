import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ToastProvider } from '@/components/feedback/toast-provider';
import { CourseFormDialog } from '@/features/courses/course-form-dialog';
import { EmployeeFormDialog } from '@/features/employees/employee-form-dialog';

describe('Resource forms', () => {
  it('shows employee validation errors', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <EmployeeFormDialog mode="create" onSubmit={async () => {}} />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: /agregar colaborador/i }));
    await user.click(screen.getByRole('button', { name: /^guardar$/i }));

    expect(await screen.findByText(/el rut es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/el apellido es obligatorio/i)).toBeInTheDocument();
  });

  it('shows course validation errors', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <CourseFormDialog mode="create" onSubmit={async () => {}} />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: /crear curso/i }));
    await user.clear(screen.getByLabelText(/duración en horas/i));
    await user.click(screen.getByRole('button', { name: /^guardar$/i }));

    expect(await screen.findByText(/el código es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/la duración debe ser mayor que cero/i)).toBeInTheDocument();
  });
});
