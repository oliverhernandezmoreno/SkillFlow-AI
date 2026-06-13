import { randomBytes } from 'node:crypto';

import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ConflictError } from '../../../../shared/domain/errors.js';
import type { PasswordHasher } from '../../../auth/domain/services/password-hasher.js';
import { User } from '../../domain/entities/user.entity.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { CreateUserDto, UserDto } from '../dto/user.dto.js';
import { UserMapper } from '../mappers/user.mapper.js';

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    input: CreateUserDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<UserDto> {
    const existing = await this.userRepository.findByEmail(input.organizationId, input.email);
    if (existing) {
      throw new ConflictError('User email already exists in organization');
    }

    const user = User.create({
      ...input,
      passwordHash: await this.passwordHasher.hash(
        input.password ?? randomBytes(32).toString('base64url'),
      ),
    });
    await this.userRepository.save(user);
    const created = UserMapper.toDto(user);
    await this.auditLogger.record({
      organizationId: input.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'User',
      entityId: user.id,
      action: 'USER_CREATED',
      metadata: { email: input.email.toLowerCase(), roleIds: input.roleIds },
      after: created,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return created;
  }
}
