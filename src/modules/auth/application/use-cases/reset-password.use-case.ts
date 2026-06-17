import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import { BadRequestError } from '../../../../shared/domain/errors.js';
import type { UserRepository } from '../../../users/domain/repositories/user.repository.js';
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.js';
import type { PasswordHasher } from '../../domain/services/password-hasher.js';
import { PasswordResetTokenService } from '../../domain/services/password-reset-token.service.js';
import type { ResetPasswordDto } from '../dto/auth.dto.js';

export class ResetPasswordUseCase {
  constructor(
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
    private readonly passwordResetTokenService = new PasswordResetTokenService(),
  ) {}

  async execute(
    input: ResetPasswordDto,
    context: { ipAddress: string | null; userAgent: string | null },
  ): Promise<void> {
    const now = new Date();
    const tokenHash = this.passwordResetTokenService.hashToken(input.token);
    const resetToken = await this.passwordResetTokenRepository.findActiveByTokenHash(tokenHash, now);
    if (!resetToken) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const existingUser = await this.userRepository.findById(resetToken.userId, resetToken.organizationId);
    if (!existingUser) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const userProps = existingUser.toPrimitives();
    existingUser.changePassword(await this.passwordHasher.hash(input.password));
    await this.userRepository.update(existingUser);
    await this.passwordResetTokenRepository.markUsed(resetToken.id, now);
    await this.passwordResetTokenRepository.invalidateActiveTokensForUser(existingUser.id, now);
    await this.auditLogger.record({
      organizationId: userProps.organizationId,
      actorUserId: existingUser.id,
      entityType: 'PasswordResetToken',
      entityId: resetToken.id,
      action: 'PASSWORD_RESET_COMPLETED',
      metadata: { userId: existingUser.id },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}
