'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

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
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/feedback/toast-provider';
import { getErrorMessage } from '@/lib/api/errors';
import { employeeFormSchema, type EmployeeFormValues } from '@/lib/validations/resources';
import type { Employee } from '@/types/resources';

interface EmployeeFormDialogProps {
  mode: 'create' | 'edit';
  employee?: Employee;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
}

export function EmployeeFormDialog({ mode, employee, onSubmit }: Readonly<EmployeeFormDialogProps>) {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      documentNumber: employee?.documentNumber ?? '',
      firstName: employee?.firstName ?? '',
      lastName: employee?.lastName ?? '',
      email: employee?.email ?? '',
      positionName: employee?.positionName ?? '',
      areaName: employee?.areaName ?? '',
    },
  });

  async function submit(values: EmployeeFormValues) {
    setSubmitError(null);
    try {
      await onSubmit(values);
      showToast({
        title: mode === 'create' ? 'Colaborador creado' : 'Colaborador actualizado',
        description: 'El registro quedó sincronizado con el backend.',
        tone: 'success',
      });
      setOpen(false);
      if (mode === 'create') {
        reset();
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setSubmitError(message);
      showToast({ title: 'No se pudo guardar el colaborador', description: message, tone: 'error' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === 'create' ? 'default' : 'ghost'} size={mode === 'create' ? 'default' : 'icon'}>
          {mode === 'create' ? <Plus className="h-4 w-4" aria-hidden="true" /> : <Pencil className="h-4 w-4" aria-hidden="true" />}
          {mode === 'create' ? 'Agregar colaborador' : null}
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <DialogContent className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-soft">
          <DialogTitle className="text-lg font-semibold">
            {mode === 'create' ? 'Agregar colaborador' : 'Editar colaborador'}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Mantén los datos del equipo alineados con el registro del backend.
          </DialogDescription>
          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={(event) =>
              void handleSubmit(submit, () =>
                showToast({ title: 'Error de validación', description: 'Revisa los campos destacados del colaborador.', tone: 'warning' }),
              )(event)
            }
          >
            <FormField label="RUT" htmlFor="documentNumber" error={errors.documentNumber?.message}>
              <Input id="documentNumber" {...register('documentNumber')} />
            </FormField>
            <FormField label="Correo electrónico" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" {...register('email')} />
            </FormField>
            <FormField label="Nombre" htmlFor="firstName" error={errors.firstName?.message}>
              <Input id="firstName" {...register('firstName')} />
            </FormField>
            <FormField label="Apellido" htmlFor="lastName" error={errors.lastName?.message}>
              <Input id="lastName" {...register('lastName')} />
            </FormField>
            <FormField label="Cargo" htmlFor="positionName" error={errors.positionName?.message}>
              <Input id="positionName" {...register('positionName')} />
            </FormField>
            <FormField label="Area" htmlFor="areaName" error={errors.areaName?.message}>
              <Input id="areaName" {...register('areaName')} />
            </FormField>
            {submitError ? <p className="sm:col-span-2 text-sm text-destructive">{submitError}</p> : null}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
