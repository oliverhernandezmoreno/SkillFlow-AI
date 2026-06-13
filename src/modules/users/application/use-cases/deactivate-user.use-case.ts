import { NotFoundError } from '../../../../shared/domain/errors.js';
import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { UserMapper } from '../mappers/user.mapper.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';

export class DeactivateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(id: string, context: UseCaseContext = anonymousUseCaseContext): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const before = UserMapper.toDto(user);
    if (context.organizationId && before.organizationId !== context.organizationId) {
      throw new NotFoundError('User not found');
    }

    user.deactivate();
    await this.userRepository.update(user);
    await this.auditLogger.record({
      organizationId: before.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'User',
      entityId: id,
      action: 'USER_DEACTIVATED',
      metadata: {},
      before,
      after: UserMapper.toDto(user),
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
  }
}
