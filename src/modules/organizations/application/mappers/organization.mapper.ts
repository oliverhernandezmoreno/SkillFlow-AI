import type { OrganizationDto } from '../dto/organization.dto.js';
import type { Organization } from '../../domain/entities/organization.entity.js';

export class OrganizationMapper {
  static toDto(organization: Organization): OrganizationDto {
    const props = organization.toPrimitives();

    return {
      id: props.id,
      name: props.tradeName ?? props.legalName,
      taxId: props.taxId,
      type: props.type,
      status: props.status,
      legalName: props.legalName,
      industry: props.industry,
      country: props.country,
      settings: props.settings,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
