export interface PasswordResetEmailInput {
  to: string;
  resetToken: string;
  expiresAt: Date;
}

export interface EmailService {
  sendPasswordReset(input: PasswordResetEmailInput): Promise<void>;
}
