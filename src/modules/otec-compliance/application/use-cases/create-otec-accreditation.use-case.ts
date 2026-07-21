import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { BadRequestError, NotFoundError } from '../../../../shared/domain/errors.js';
import { OtecAccreditation } from '../../domain/entities/otec-accreditation.entity.js';
import type {
  CreateOtecAccreditationDto,
  OtecAccreditationDto,
} from '../dto/otec-accreditation.dto.js';
import { OtecAccreditationMapper } from '../mappers/otec-accreditation.mapper.js';
import type { OtecComplianceTransactionManager } from '../ports/otec-compliance-unit-of-work.js';
import type { ModuleAccessEvaluator, TimeProvider } from './otec-office-use-case.helpers.js';
import {
  auditContext,
  requireAccreditationEntitlement,
  requireTenantId,
} from './otec-accreditation-use-case.helpers.js';

export class CreateOtecAccreditationUseCase {
  constructor(
    private readonly transactionManager: OtecComplianceTransactionManager,
    private readonly access: ModuleAccessEvaluator,
    private readonly now: TimeProvider = () => new Date(),
  ) {}

  async execute(
    input: CreateOtecAccreditationDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<OtecAccreditationDto> {
    const organizationId = requireTenantId(context);
    await requireAccreditationEntitlement(
      this.access,
      organizationId,
      this.now(),
      context,
      'otec_compliance.accreditation.manage',
    );
    if (input.status !== undefined && input.status !== 'ACTIVE')
      throw new BadRequestError('New accreditations must start ACTIVE');
    return this.transactionManager.run(async (unitOfWork) => {
      const profile = await unitOfWork.otecProfileRepository.findById(
        organizationId,
        input.otecProfileId,
      );
      if (profile?.toPrimitives().registrationStatus !== 'ACTIVE')
        throw new NotFoundError('The active OTEC profile was not found');
      const accreditation = OtecAccreditation.create({
        organizationId,
        otecProfileId: input.otecProfileId,
        accreditationType: input.accreditationType,
        accreditationNumber: input.accreditationNumber,
        issuedAt: input.issuedAt ?? null,
        validFrom: input.validFrom ?? null,
        validUntil: input.validUntil ?? null,
        issuingAuthority: input.issuingAuthority ?? null,
        source: input.source ?? null,
        externalReference: input.externalReference ?? null,
        notes: input.notes ?? null,
      });
      await unitOfWork.otecAccreditationRepository.save(accreditation);
      const result = OtecAccreditationMapper.toDto(accreditation);
      await unitOfWork.auditLogger.record({
        organizationId,
        ...auditContext(context),
        entityType: 'OtecAccreditation',
        entityId: accreditation.id,
        action: 'OTEC_ACCREDITATION_CREATED',
        metadata: {},
        after: result,
      });
      return result;
    });
  }
}
