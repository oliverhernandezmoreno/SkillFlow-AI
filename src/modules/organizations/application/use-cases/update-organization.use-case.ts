import { NotFoundError } from '../../../../shared/domain/errors.js';
import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { OrganizationRepository } from '../../domain/repositories/organization.repository.js';
import type { OrganizationDto, UpdateOrganizationDto } from '../dto/organization.dto.js';
import { OrganizationMapper } from '../mappers/organization.mapper.js';

export class UpdateOrganizationUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    id: string,
    input: UpdateOrganizationDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OrganizationDto> {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }
    const before = OrganizationMapper.toDto(organization);

    organization.update({
      legalName: input.legalName ?? input.name,
      tradeName: input.name,
      email: input.email,
      type: input.type,
      industry: input.industry,
      country: input.country,
      settings: input.settings,
    });
    await this.organizationRepository.update(organization);
    const after = OrganizationMapper.toDto(organization);
    await this.auditLogger.record({
      organizationId: organization.id,
      actorUserId: context.actorUserId,
      entityType: 'Organization',
      entityId: organization.id,
      action: 'ORGANIZATION_UPDATED',
      metadata: {},
      before,
      after,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return after;
  }
}
