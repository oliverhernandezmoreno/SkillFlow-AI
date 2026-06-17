import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import type { AuthIdentityRepository } from '../../domain/repositories/auth-identity.repository.js';
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.js';
import type { EmailService } from '../../domain/services/email-service.js';
import { PasswordResetTokenService } from '../../domain/services/password-reset-token.service.js';
import type { ForgotPasswordDto } from '../dto/auth.dto.js';

const passwordResetTtlMs = 15 * 60 * 1000;

export class ForgotPasswordUseCase {
  constructor(
    private readonly authIdentityRepository: AuthIdentityRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly emailService: EmailService,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
    private readonly passwordResetTokenService = new PasswordResetTokenService(),
  ) {}

  async execute(
    input: ForgotPasswordDto,
    context: { ipAddress: string | null; userAgent: string | null },
  ): Promise<void> {
    const normalizedEmail = input.email.toLowerCase();
    const user = await this.authIdentityRepository.findUserByEmail(normalizedEmail);

    if (!user) {
      await this.auditLogger.record({
        organizationId: null,
        actorUserId: null,
        entityType: 'Auth',
        entityId: null,
        action: 'PASSWORD_RESET_REQUESTED_UNKNOWN_EMAIL',
        metadata: { email: normalizedEmail },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      return;
    }

    const userProps = user.toPrimitives();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + passwordResetTtlMs);
    const resetToken = this.passwordResetTokenService.createToken();
    const tokenHash = this.passwordResetTokenService.hashToken(resetToken);

    await this.passwordResetTokenRepository.invalidateActiveTokensForUser(user.id, now);
    const record = await this.passwordResetTokenRepository.save({
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    await this.emailService.sendPasswordReset({
      to: userProps.email,
      resetToken,
      expiresAt,
    });
    await this.auditLogger.record({
      organizationId: userProps.organizationId,
      actorUserId: user.id,
      entityType: 'PasswordResetToken',
      entityId: record.id,
      action: 'PASSWORD_RESET_REQUESTED',
      metadata: { email: normalizedEmail, expiresAt: expiresAt.toISOString() },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}
