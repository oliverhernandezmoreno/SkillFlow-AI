'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarPlus, Pencil } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/api/errors';
import { trainingSessionFormSchema, type TrainingSessionFormValues } from '@/lib/validations/resources';
import type { Course, TrainingSession } from '@/types/resources';

interface TrainingSessionFormDialogProps {
  mode: 'create' | 'edit';
  courses: Course[];
  session?: TrainingSession;
  onSubmit: (values: TrainingSessionFormValues) => Promise<void>;
}

export function TrainingSessionFormDialog({ mode, courses, session, onSubmit }: Readonly<TrainingSessionFormDialogProps>) {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TrainingSessionFormValues>({
    resolver: zodResolver(trainingSessionFormSchema),
    defaultValues: {
      courseId: session?.courseId ?? courses[0]?.id ?? '',
      name: session?.name ?? '',
      startDate: toDateTimeLocal(session?.startDate),
      endDate: toDateTimeLocal(session?.endDate),
      location: session?.location ?? '',
      capacity: session?.capacity ?? 20,
      meetingUrl: session?.meetingUrl ?? '',
    },
  });

  async function submit(values: TrainingSessionFormValues) {
    setSubmitError(null);
    try {
      await onSubmit(values);
      showToast({
        title: mode === 'create' ? 'Sesión programada' : 'Sesión actualizada',
        description: 'Los datos de la sesión quedaron sincronizados con el backend.',
        tone: 'success',
      });
      setOpen(false);
      if (mode === 'create') {
        reset();
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setSubmitError(message);
      showToast({ title: 'No se pudo guardar la sesión', description: message, tone: 'error' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === 'create' ? 'default' : 'ghost'} size={mode === 'create' ? 'default' : 'icon'}>
          {mode === 'create' ? <CalendarPlus className="h-4 w-4" aria-hidden="true" /> : <Pencil className="h-4 w-4" aria-hidden="true" />}
          {mode === 'create' ? 'Programar sesión' : null}
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <DialogContent className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-card p-6 shadow-soft">
          <DialogTitle className="text-lg font-semibold">
            {mode === 'create' ? 'Programar sesión' : 'Editar sesión'}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Configura los datos mínimos para inscripciones y asistencia.
          </DialogDescription>
          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={(event) =>
              void handleSubmit(submit, () =>
                showToast({ title: 'Error de validación', description: 'Revisa los campos destacados de la sesión.', tone: 'warning' }),
              )(event)
            }
          >
            <FormField label="Curso" htmlFor="courseId" error={errors.courseId?.message}>
              <select id="courseId" className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('courseId')}>
                <option value="">Selecciona un curso</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Capacidad" htmlFor="capacity" error={errors.capacity?.message}>
              <Input id="capacity" type="number" min="1" {...register('capacity')} />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Nombre de la sesión" htmlFor="name" error={errors.name?.message}>
                <Input id="name" {...register('name')} />
              </FormField>
            </div>
            <FormField label="Inicio" htmlFor="startDate" error={errors.startDate?.message}>
              <Input id="startDate" type="datetime-local" {...register('startDate')} />
            </FormField>
            <FormField label="Término" htmlFor="endDate" error={errors.endDate?.message}>
              <Input id="endDate" type="datetime-local" {...register('endDate')} />
            </FormField>
            <FormField label="Ubicación" htmlFor="location" error={errors.location?.message}>
              <Input id="location" {...register('location')} />
            </FormField>
            <FormField label="Meeting URL" htmlFor="meetingUrl" error={errors.meetingUrl?.message}>
              <Input id="meetingUrl" type="url" {...register('meetingUrl')} />
            </FormField>
            {submitError ? <p className="text-sm text-destructive sm:col-span-2">{submitError}</p> : null}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button disabled={isSubmitting || courses.length === 0}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return '';
  }
  return value.slice(0, 16);
}
