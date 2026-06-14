import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { UserDto } from '../dto/user.dto.js';
import { UserMapper } from '../mappers/user.mapper.js';

export class ActivateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(id: string, context: UseCaseContext = anonymousUseCaseContext): Promise<UserDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await this.userRepository.findById(id, context.organizationId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const before = UserMapper.toDto(user);

    user.activate();
    await this.userRepository.update(user);
    const after = UserMapper.toDto(user);
    await this.auditLogger.record({
      organizationId: after.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'User',
      entityId: id,
      action: 'USER_ACTIVATED',
      metadata: {},
      before,
      after,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return after;
  }
}
