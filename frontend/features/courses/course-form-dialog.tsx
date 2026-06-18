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
import { courseFormSchema, type CourseFormValues } from '@/lib/validations/resources';
import type { Course } from '@/types/resources';

interface CourseFormDialogProps {
  mode: 'create' | 'edit';
  course?: Course;
  onSubmit: (values: CourseFormValues) => Promise<void>;
}

export function CourseFormDialog({ mode, course, onSubmit }: Readonly<CourseFormDialogProps>) {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      code: course?.code ?? '',
      name: course?.name ?? '',
      description: course?.description ?? '',
      modality: course?.modality ?? 'PRESENTIAL',
      durationHours: course?.durationHours ?? 1,
    },
  });

  async function submit(values: CourseFormValues) {
    setSubmitError(null);
    try {
      await onSubmit(values);
      showToast({
        title: mode === 'create' ? 'Curso creado' : 'Curso actualizado',
        description: 'Los datos del catálogo quedaron sincronizados con el backend.',
        tone: 'success',
      });
      setOpen(false);
      if (mode === 'create') {
        reset();
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setSubmitError(message);
      showToast({ title: 'No se pudo guardar el curso', description: message, tone: 'error' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === 'create' ? 'default' : 'ghost'} size={mode === 'create' ? 'default' : 'icon'}>
          {mode === 'create' ? <Plus className="h-4 w-4" aria-hidden="true" /> : <Pencil className="h-4 w-4" aria-hidden="true" />}
          {mode === 'create' ? 'Crear curso' : null}
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <DialogContent className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-soft">
          <DialogTitle className="text-lg font-semibold">
            {mode === 'create' ? 'Crear curso' : 'Editar curso'}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Mantén el catálogo que alimenta sesiones, inscripciones y certificados.
          </DialogDescription>
          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={(event) =>
              void handleSubmit(submit, () =>
                showToast({ title: 'Error de validación', description: 'Revisa los campos destacados del curso.', tone: 'warning' }),
              )(event)
            }
          >
            <FormField label="Código" htmlFor="code" error={errors.code?.message}>
              <Input id="code" {...register('code')} />
            </FormField>
            <FormField label="Duración en horas" htmlFor="durationHours" error={errors.durationHours?.message}>
              <Input id="durationHours" type="number" min="0.5" step="0.5" {...register('durationHours')} />
            </FormField>
            <FormField label="Nombre" htmlFor="name" error={errors.name?.message}>
              <Input id="name" {...register('name')} />
            </FormField>
            <FormField label="Modalidad" htmlFor="modality" error={errors.modality?.message}>
              <select
                id="modality"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('modality')}
              >
                <option value="PRESENTIAL">PRESENTIAL</option>
                <option value="ONLINE">ONLINE</option>
                <option value="HYBRID">HYBRID</option>
                <option value="BLENDED">BLENDED</option>
                <option value="ASYNC">ASYNC</option>
              </select>
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Descripción" htmlFor="description" error={errors.description?.message}>
                <Input id="description" {...register('description')} />
              </FormField>
            </div>
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
