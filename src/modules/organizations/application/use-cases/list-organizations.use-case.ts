import type { PaginatedResult } from '../../../../shared/application/pagination.js';
import { createPagination } from '../../../../shared/application/pagination.js';
import type { OrganizationRepository } from '../../domain/repositories/organization.repository.js';
import type { OrganizationDto } from '../dto/organization.dto.js';
import { OrganizationMapper } from '../mappers/organization.mapper.js';

export class ListOrganizationsUseCase {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(input: {
    page?: number | undefined;
    pageSize?: number | undefined;
    search?: string | undefined;
  }): Promise<PaginatedResult<OrganizationDto>> {
    const result = await this.organizationRepository.search(
      { search: input.search },
      createPagination(input),
    );

    return {
      data: result.data.map(OrganizationMapper.toDto),
      meta: result.meta,
    };
  }
}
