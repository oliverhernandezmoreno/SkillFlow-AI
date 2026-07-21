'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  otecProfileFormSchema,
  type OtecProfile,
  type OtecProfileFormValues,
} from './schemas';

interface OtecProfileFormProps {
  mode: 'create' | 'edit';
  profile?: OtecProfile;
  submitting: boolean;
  submitError?: string | null;
  onCancel: () => void;
  onSubmit: (values: OtecProfileFormValues) => Promise<void>;
}

export function OtecProfileForm({ mode, profile, submitting, submitError, onCancel, onSubmit }: Readonly<OtecProfileFormProps>) {
  const defaults = toFormValues(profile);
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<OtecProfileFormValues>({
    resolver: zodResolver(otecProfileFormSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!isDirty) reset(toFormValues(profile));
  }, [isDirty, profile, reset]);

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg font-semibold">{mode === 'create' ? 'Crear perfil OTEC' : 'Editar perfil OTEC'}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Configuración interna del tenant autenticado. No constituye validación oficial.</p>
      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
        <FormField label="Código de registro" htmlFor="registrationCode" error={errors.registrationCode?.message}>
          <Input id="registrationCode" {...register('registrationCode')} />
        </FormField>
        <FormField label="Referencia RUDO" htmlFor="rudoReference" error={errors.rudoReference?.message}>
          <Input id="rudoReference" {...register('rudoReference')} />
        </FormField>
        <FormField label="Nombre de contacto técnico" htmlFor="technicalContactName" error={errors.technicalContactName?.message}>
          <Input id="technicalContactName" {...register('technicalContactName')} />
        </FormField>
        <FormField label="Correo de contacto técnico" htmlFor="technicalContactEmail" error={errors.technicalContactEmail?.message}>
          <Input id="technicalContactEmail" type="email" {...register('technicalContactEmail')} />
        </FormField>
        <FormField label="Teléfono de contacto técnico" htmlFor="technicalContactPhone" error={errors.technicalContactPhone?.message}>
          <Input id="technicalContactPhone" {...register('technicalContactPhone')} />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Notas" htmlFor="notes" error={errors.notes?.message}>
            <textarea id="notes" className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('notes')} />
          </FormField>
        </div>
        {submitError ? <p className="sm:col-span-2 text-sm text-destructive" role="alert">{submitError}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={submitting || (mode === 'edit' && !isDirty)}>
            {submitting ? 'Guardando…' : mode === 'create' ? 'Crear perfil OTEC' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function toFormValues(profile?: OtecProfile): OtecProfileFormValues {
  return {
    registrationCode: profile?.registrationCode ?? '',
    rudoReference: profile?.rudoReference ?? '',
    technicalContactName: profile?.technicalContactName ?? '',
    technicalContactEmail: profile?.technicalContactEmail ?? '',
    technicalContactPhone: profile?.technicalContactPhone ?? '',
    notes: profile?.notes ?? '',
  };
}
