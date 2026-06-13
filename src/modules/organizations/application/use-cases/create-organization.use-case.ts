import { ConflictError } from '../../../../shared/domain/errors.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import { Organization } from '../../domain/entities/organization.entity.js';
import type { OrganizationRepository } from '../../domain/repositories/organization.repository.js';
import type { CreateOrganizationDto, OrganizationDto } from '../dto/organization.dto.js';
import { OrganizationMapper } from '../mappers/organization.mapper.js';

export class CreateOrganizationUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    input: CreateOrganizationDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OrganizationDto> {
    const existing = await this.organizationRepository.findByTaxId(input.taxId);
    if (existing) {
      throw new ConflictError('Organization tax ID already exists');
    }

    const organization = Organization.create({
      legalName: input.legalName ?? input.name,
      tradeName: input.name,
      taxId: input.taxId,
      email: input.email ?? 'contact@skillflow.local',
      type: input.type,
      industry: input.industry,
      country: input.country,
      settings: input.settings,
    });

    await this.organizationRepository.save(organization);
    const created = OrganizationMapper.toDto(organization);
    await this.auditLogger.record({
      organizationId: organization.id,
      actorUserId: context.actorUserId,
      entityType: 'Organization',
      entityId: organization.id,
      action: 'ORGANIZATION_CREATED',
      metadata: { taxId: input.taxId },
      after: created,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return created;
  }
}
