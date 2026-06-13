import { ConflictError } from '../../../../shared/domain/errors.js';
import { Organization } from '../../../organizations/domain/entities/organization.entity.js';
import type { OrganizationRepository } from '../../../organizations/domain/repositories/organization.repository.js';
import { User } from '../../../users/domain/entities/user.entity.js';
import type { UserRepository } from '../../../users/domain/repositories/user.repository.js';
import { UserMapper } from '../../../users/application/mappers/user.mapper.js';
import type { PasswordHasher } from '../../domain/services/password-hasher.js';
import type { TokenService } from '../../domain/services/token-service.js';
import type { AuthResponseDto, RegisterDto } from '../dto/auth.dto.js';

export class RegisterOrganizationUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RegisterDto): Promise<AuthResponseDto> {
    const existingOrganization = await this.organizationRepository.findByTaxId(input.taxId);
    if (existingOrganization) {
      throw new ConflictError('Organization tax ID already exists');
    }

    const organization = Organization.create({
      legalName: input.organizationName,
      tradeName: input.organizationName,
      taxId: input.taxId,
      email: input.email,
      type: 'CLIENT',
    });
    const organizationId = organization.id;

    const existingUser = await this.userRepository.findByEmail(organizationId, input.email);
    if (existingUser) {
      throw new ConflictError('User email already exists in organization');
    }

    const user = User.create({
      organizationId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash: await this.passwordHasher.hash(input.password),
      roleIds: [],
    });

    await this.organizationRepository.save(organization);
    await this.userRepository.save(user);

    return {
      ...this.tokenService.createTokenPair(user),
      user: UserMapper.toDto(user),
    };
  }
}
