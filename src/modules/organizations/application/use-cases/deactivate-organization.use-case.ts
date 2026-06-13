import { NotFoundError } from '../../../../shared/domain/errors.js';
import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { OrganizationMapper } from '../mappers/organization.mapper.js';
import type { OrganizationRepository } from '../../domain/repositories/organization.repository.js';

export class DeactivateOrganizationUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(id: string, context: UseCaseContext = anonymousUseCaseContext): Promise<void> {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }
    const before = OrganizationMapper.toDto(organization);

    organization.deactivate();
    await this.organizationRepository.update(organization);
    await this.auditLogger.record({
      organizationId: organization.id,
      actorUserId: context.actorUserId,
      entityType: 'Organization',
      entityId: organization.id,
      action: 'ORGANIZATION_DEACTIVATED',
      metadata: {},
      before,
      after: OrganizationMapper.toDto(organization),
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
  }
}
