import { NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { UserDto } from '../dto/user.dto.js';
import { UserMapper } from '../mappers/user.mapper.js';

export class GetUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string, context: UseCaseContext = anonymousUseCaseContext): Promise<UserDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await this.userRepository.findById(id, context.organizationId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const dto = UserMapper.toDto(user);

    return dto;
  }
}
