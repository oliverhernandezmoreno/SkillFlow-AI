import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid business email.'),
  password: z.string().min(8, 'Password must contain at least 8 characters.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid business email.'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must contain at least 8 characters.'),
    confirmPassword: z.string().min(8, 'Password confirmation is required.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords must match.',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
