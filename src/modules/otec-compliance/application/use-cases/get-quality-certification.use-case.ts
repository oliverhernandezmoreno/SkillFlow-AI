import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { QualityCertificationRepository } from '../../domain/repositories/otec-regulatory-record.repositories.js';
import type { QualityCertificationDto } from '../dto/quality-certification.dto.js';
import { QualityCertificationMapper } from '../mappers/quality-certification.mapper.js';
import {
  findCertificationOrThrow,
  requireCertificationEntitlement,
  requireTenantId,
} from './quality-certification-use-case.helpers.js';
import type { ModuleAccessEvaluator, TimeProvider } from './otec-office-use-case.helpers.js';
export class GetQualityCertificationUseCase {
  constructor(
    private readonly repository: QualityCertificationRepository,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    id: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<QualityCertificationDto> {
    const organizationId = requireTenantId(context);
    await requireCertificationEntitlement(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.read',
    );
    return QualityCertificationMapper.toDto(
      await findCertificationOrThrow(this.repository, organizationId, id),
    );
  }
}
