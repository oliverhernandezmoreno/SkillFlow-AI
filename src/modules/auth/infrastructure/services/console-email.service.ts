import type { EmailService, PasswordResetEmailInput } from '../../domain/services/email-service.js';

export class ConsoleEmailService implements EmailService {
  async sendPasswordReset(input: PasswordResetEmailInput): Promise<void> {
    const resetUrl = `http://localhost:3001/reset-password?token=${encodeURIComponent(input.resetToken)}`;
    console.info(
      JSON.stringify(
        {
          type: 'PASSWORD_RESET_EMAIL_STUB',
          to: input.to,
          resetUrl,
          expiresAt: input.expiresAt.toISOString(),
        },
        null,
        2,
      ),
    );
  }
}
