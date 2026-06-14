import { UnauthorizedError } from '../../../../shared/domain/errors.js';
import { UserMapper } from '../../../users/application/mappers/user.mapper.js';
import type { AuthIdentityRepository } from '../../domain/repositories/auth-identity.repository.js';
import type { PasswordHasher } from '../../domain/services/password-hasher.js';
import type { TokenService } from '../../domain/services/token-service.js';
import type { AuthResponseDto, LoginDto } from '../dto/auth.dto.js';

interface LoginContext {
  ipAddress: string | null;
  userAgent: string | null;
}

export class LoginUseCase {
  constructor(
    private readonly authIdentityRepository: AuthIdentityRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginDto, context: LoginContext): Promise<AuthResponseDto> {
    const user = await this.authIdentityRepository.findUserByEmail(input.email);
    if (!user) {
      await this.recordFailure(input.email, null, null, context);
      throw new UnauthorizedError('Invalid credentials');
    }

    const props = user.toPrimitives();
    const isValid = await this.passwordHasher.verify(input.password, props.passwordHash);
    if (!isValid || props.status !== 'ACTIVE') {
      await this.recordFailure(input.email, props.organizationId, props.id, context);
      throw new UnauthorizedError('Invalid credentials');
    }

    const permissions = await this.authIdentityRepository.findPermissionCodesByUserId(props.id);
    await this.authIdentityRepository.recordSuccessfulLogin(props.id, props.organizationId);
    await this.authIdentityRepository.recordLoginAuditEvent({
      organizationId: props.organizationId,
      actorUserId: props.id,
      email: props.email,
      success: true,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      ...this.tokenService.createTokenPair(user, permissions),
      user: UserMapper.toDto(user),
    };
  }

  private async recordFailure(
    email: string,
    organizationId: string | null,
    actorUserId: string | null,
    context: LoginContext,
  ): Promise<void> {
    await this.authIdentityRepository.recordLoginAuditEvent({
      organizationId,
      actorUserId,
      email,
      success: false,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}
