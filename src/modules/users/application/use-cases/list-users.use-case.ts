import type { PaginatedResult } from '../../../../shared/application/pagination.js';
import { createPagination } from '../../../../shared/application/pagination.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { UserDto } from '../dto/user.dto.js';
import { UserMapper } from '../mappers/user.mapper.js';

export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: {
    organizationId: string;
    page?: number | undefined;
    pageSize?: number | undefined;
    search?: string | undefined;
  }): Promise<PaginatedResult<UserDto>> {
    const result = await this.userRepository.search(
      { organizationId: input.organizationId, search: input.search },
      createPagination(input),
    );

    return { data: result.data.map(UserMapper.toDto), meta: result.meta };
  }
}
