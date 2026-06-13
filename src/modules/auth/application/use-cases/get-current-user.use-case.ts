import { UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { UserDto } from '../../../users/application/dto/user.dto.js';
import { UserMapper } from '../../../users/application/mappers/user.mapper.js';
import type { UserRepository } from '../../../users/domain/repositories/user.repository.js';

export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string | null): Promise<UserDto> {
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    return UserMapper.toDto(user);
  }
}
