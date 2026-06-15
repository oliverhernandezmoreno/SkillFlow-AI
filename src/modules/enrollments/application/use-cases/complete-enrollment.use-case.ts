import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { EnrollmentRepository } from '../../domain/repositories/enrollment.repository.js';
import type { EnrollmentDto } from '../dto/enrollment.dto.js';
import { EnrollmentMapper } from '../mappers/enrollment.mapper.js';

export class CompleteEnrollmentUseCase {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(id: string, context: UseCaseContext = anonymousUseCaseContext): Promise<EnrollmentDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    const enrollment = await this.enrollmentRepository.findById(id, context.organizationId);
    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    const before = EnrollmentMapper.toDto(enrollment);
    enrollment.complete();
    await this.enrollmentRepository.update(enrollment);
    const after = EnrollmentMapper.toDto(enrollment);
    await this.auditLogger.record({
      organizationId: context.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'ENROLLMENT',
      entityId: enrollment.id,
      action: 'ENROLLMENT_COMPLETED',
      metadata: { previousStatus: before.status, nextStatus: after.status },
      before,
      after,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return after;
  }
}
