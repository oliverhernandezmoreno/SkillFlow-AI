import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { OrganizationRepository } from '../../domain/repositories/organization.repository.js';
import type { OrganizationDto } from '../dto/organization.dto.js';
import { OrganizationMapper } from '../mappers/organization.mapper.js';

export class GetOrganizationUseCase {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(id: string): Promise<OrganizationDto> {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    return OrganizationMapper.toDto(organization);
  }
}
