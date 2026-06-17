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

    await user.click(screen.getByRole('button', { name: /add employee/i }));
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(await screen.findByText(/document number is required/i)).toBeInTheDocument();
    expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
  });

  it('shows course validation errors', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <CourseFormDialog mode="create" onSubmit={async () => {}} />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: /create course/i }));
    await user.clear(screen.getByLabelText(/duration hours/i));
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(await screen.findByText(/code is required/i)).toBeInTheDocument();
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/duration must be greater than zero/i)).toBeInTheDocument();
  });
});
