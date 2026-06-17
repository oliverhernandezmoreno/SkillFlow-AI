'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useToast } from '@/components/feedback/toast-provider';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getErrorMessage } from '@/lib/api/errors';
import { enrollmentFormSchema, type EnrollmentFormValues } from '@/lib/validations/resources';
import type { Employee, TrainingSession } from '@/types/resources';

interface EnrollmentFormDialogProps {
  employees: Employee[];
  sessions: TrainingSession[];
  onSubmit: (values: EnrollmentFormValues) => Promise<void>;
}

export function EnrollmentFormDialog({ employees, sessions, onSubmit }: Readonly<EnrollmentFormDialogProps>) {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      employeeId: employees[0]?.id ?? '',
      trainingSessionId: sessions[0]?.id ?? '',
    },
  });

  async function submit(values: EnrollmentFormValues) {
    setSubmitError(null);
    try {
      await onSubmit(values);
      showToast({
        title: 'Participant enrolled',
        description: 'Enrollment is now tracked by the backend.',
        tone: 'success',
      });
      setOpen(false);
      reset();
    } catch (error) {
      const message = getErrorMessage(error);
      setSubmitError(message);
      showToast({ title: 'Unable to enroll participant', description: message, tone: 'error' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Enroll participant
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <DialogContent className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-soft">
          <DialogTitle className="text-lg font-semibold">Enroll participant</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Select an employee and a scheduled or published session.
          </DialogDescription>
          <form
            className="mt-6 grid gap-4"
            onSubmit={(event) =>
              void handleSubmit(submit, () =>
                showToast({ title: 'Validation error', description: 'Select an employee and a session.', tone: 'warning' }),
              )(event)
            }
          >
            <FormField label="Employee" htmlFor="employeeId" error={errors.employeeId?.message}>
              <select id="employeeId" className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('employeeId')}>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Session" htmlFor="trainingSessionId" error={errors.trainingSessionId?.message}>
              <select id="trainingSessionId" className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('trainingSessionId')}>
                <option value="">Select session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </FormField>
            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={isSubmitting || employees.length === 0 || sessions.length === 0}>
                {isSubmitting ? 'Enrolling...' : 'Enroll'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
