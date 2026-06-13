import { NotFoundError } from '../../../../shared/domain/errors.js';
import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { PasswordHasher } from '../../../auth/domain/services/password-hasher.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { UpdateUserDto, UserDto } from '../dto/user.dto.js';
import { UserMapper } from '../mappers/user.mapper.js';

export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    id: string,
    input: UpdateUserDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<UserDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const before = UserMapper.toDto(user);
    if (context.organizationId && before.organizationId !== context.organizationId) {
      throw new NotFoundError('User not found');
    }

    const { password, ...profileInput } = input;
    user.update(profileInput);
    if (password) {
      user.changePassword(await this.passwordHasher.hash(password));
    }
    await this.userRepository.update(user);
    const after = UserMapper.toDto(user);
    await this.auditLogger.record({
      organizationId: after.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'User',
      entityId: id,
      action: password ? 'USER_UPDATED_WITH_PASSWORD_CHANGE' : 'USER_UPDATED',
      metadata: {
        roleIds: input.roleIds,
        status: input.status,
        passwordChanged: Boolean(password),
      },
      before,
      after,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return after;
  }
}
