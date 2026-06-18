'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { forgotPassword } from '@/lib/auth/session';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/lib/validations/auth';

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setStatus('idle');
    try {
      await forgotPassword(values.email);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(79,70,229,0.16),transparent_35%),linear-gradient(225deg,rgba(16,185,129,0.12),transparent_32%)]" />
      <Card className="mx-auto w-full max-w-md p-6 shadow-soft">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground" href="/login">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al ingreso
        </Link>
        <div className="mb-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-normal">Recuperar acceso</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Si el correo existe, enviaremos instrucciones para recuperar el acceso.
          </p>
        </div>
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <FormField label="Correo electrónico" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
          </FormField>
          {status === 'success' ? (
            <p className="rounded-md border bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Si el correo existe, enviaremos instrucciones para recuperar el acceso.
            </p>
          ) : null}
          {status === 'error' ? (
            <p className="rounded-md border bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              No se pudo procesar la solicitud en este momento.
            </p>
          ) : null}
          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
