import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import type {
  DeactivateLegalRepresentativeDto,
  LegalRepresentativeDto,
} from '../dto/legal-representative.dto.js';
import { LegalRepresentativeMapper } from '../mappers/legal-representative.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import {
  auditContext,
  findRepresentativeOrThrow,
  requireRepresentativeAccess,
  requireTenantId,
  type ModuleAccessEvaluator,
  type TimeProvider,
} from './legal-representative-use-case.helpers.js';
export class DeactivateLegalRepresentativeUseCase {
  constructor(
    private readonly transactions: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}
  async execute(
    id: string,
    input: DeactivateLegalRepresentativeDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<LegalRepresentativeDto> {
    const organizationId = requireTenantId(context);
    const operationTime = this.now();
    await requireRepresentativeAccess(
      this.access,
      organizationId,
      operationTime,
      context,
      'otec_compliance.representative.manage',
    );
    return this.transactions.run(async (uow) => {
      const item = await findRepresentativeOrThrow(
        uow.legalRepresentativeRepository,
        organizationId,
        id,
      );
      const before = LegalRepresentativeMapper.toSafeAudit(item);
      item.deactivate(operationTime);
      await uow.legalRepresentativeRepository.update(item, input.expectedVersion);
      const after = LegalRepresentativeMapper.toSafeAudit(item);
      await uow.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'LegalRepresentative',
        entityId: id,
        action: 'LEGAL_REPRESENTATIVE_DEACTIVATED',
        metadata: { internalRecordOnly: true, reason: input.reason ?? null },
        before,
        after,
      });
      return LegalRepresentativeMapper.toDto(item);
    });
  }
}
