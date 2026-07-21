import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { OtecAccreditationRepository } from '../../domain/repositories/otec-regulatory-record.repositories.js';
import type { OtecAccreditationDto } from '../dto/otec-accreditation.dto.js';
import { OtecAccreditationMapper } from '../mappers/otec-accreditation.mapper.js';
import {
  findAccreditationOrThrow,
  requireAccreditationEntitlement,
  requireTenantId,
} from './otec-accreditation-use-case.helpers.js';
import type { ModuleAccessEvaluator, TimeProvider } from './otec-office-use-case.helpers.js';

export class GetOtecAccreditationUseCase {
  constructor(
    private readonly repository: OtecAccreditationRepository,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    id: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OtecAccreditationDto> {
    const organizationId = requireTenantId(context);
    await requireAccreditationEntitlement(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.read',
    );
    return OtecAccreditationMapper.toDto(
      await findAccreditationOrThrow(this.repository, organizationId, id),
    );
  }
}
