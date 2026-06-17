'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { resetPassword } from '@/lib/auth/session';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validations/auth';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center">Loading...</main>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setStatus('idle');
    try {
      await resetPassword(token, values.password);
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
          Back to sign in
        </Link>
        <div className="mb-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-normal">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a new password to recover access to your account.
          </p>
        </div>
        {!token ? (
          <p className="mb-4 rounded-md border bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            A reset token is required to continue.
          </p>
        ) : null}
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <FormField label="New password" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
          </FormField>
          <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...register('confirmPassword')} />
          </FormField>
          {status === 'success' ? (
            <p className="rounded-md border bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Password updated. You can sign in with the new password.
            </p>
          ) : null}
          {status === 'error' ? (
            <p className="rounded-md border bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              Unable to reset the password with the current token.
            </p>
          ) : null}
          <Button className="w-full" disabled={isSubmitting || !token}>
            {isSubmitting ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
