import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type { OtecResolutionDto } from '../dto/otec-resolution.dto.js';
import { OtecResolutionMapper } from '../mappers/otec-resolution.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  findResolutionOrThrow,
  requireResolutionAccess,
  requireTenantId,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './otec-resolution-use-case.helpers.js';
export class GetOtecResolutionUseCase {
  constructor(
    private readonly tx: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    id: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OtecResolutionDto> {
    const organizationId = requireTenantId(context);
    await requireResolutionAccess(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.read',
    );
    return this.tx.run(async (uow) =>
      OtecResolutionMapper.toDto(
        await findResolutionOrThrow(uow.otecResolutionRepository, organizationId, id),
      ),
    );
  }
}
