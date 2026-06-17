'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, BarChart3, KeyRound, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/feedback/toast-provider';
import { getErrorMessage } from '@/lib/api/errors';
import { demoAccount } from '@/lib/constants/demo-account';
import { login } from '@/lib/auth/session';
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center">Loading...</main>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function fillDemoAccount() {
    setValue('email', demoAccount.email, { shouldValidate: true });
    setValue('password', demoAccount.password, { shouldValidate: true });
  }

  async function onSubmit(values: LoginFormValues) {
    setErrorMessage(null);
    try {
      await login(values);
      showToast({
        title: 'Signed in',
        description: 'Demo workspace connected successfully.',
        tone: 'success',
      });
      router.replace(searchParams.get('next') ?? '/dashboard');
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      showToast({ title: 'Login failed', description: message, tone: 'error' });
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(79,70,229,0.16),transparent_35%),linear-gradient(225deg,rgba(16,185,129,0.12),transparent_32%)]" />
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            Premium HRTech command center
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-normal text-foreground">
            SkillFlow AI
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Learning, Compliance & Workforce Intelligence
          </p>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
            {[
              { icon: ShieldCheck, title: 'Compliance-ready', text: 'PAC, SENCE, certificates and audit trails.' },
              { icon: BarChart3, title: 'Executive clarity', text: 'Live training KPIs and workforce signals.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="glass-panel p-5">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h2 className="mt-4 font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md p-6 shadow-soft">
          <div className="mb-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              SF
            </div>
            <h2 className="text-2xl font-semibold tracking-normal">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to manage training, compliance and workforce readiness.
            </p>
          </div>
          <div className="mb-5 rounded-lg border bg-muted/45 p-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Demo access</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">{demoAccount.email}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={fillDemoAccount}>
                Use demo
              </Button>
            </div>
          </div>
          <form className="space-y-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" autoComplete="email" {...register('email')} />
            </FormField>
            <FormField label="Password" htmlFor="password" error={errors.password?.message}>
              <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
            </FormField>
            <div className="flex justify-end">
              <Link className="text-sm font-medium text-primary hover:underline" href="/forgot-password">
                Forgot your password?
              </Link>
            </div>
            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
