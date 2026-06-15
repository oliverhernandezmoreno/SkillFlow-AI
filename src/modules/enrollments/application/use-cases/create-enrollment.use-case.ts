import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../../../shared/domain/errors.js';
import type { CourseRepository } from '../../../courses/domain/repositories/course.repository.js';
import type { EmployeeRepository } from '../../../employees/domain/repositories/employee.repository.js';
import type { TrainingSessionRepository } from '../../../training-sessions/domain/repositories/training-session.repository.js';
import { occupiedEnrollmentStatuses } from '../../domain/entities/enrollment.entity.js';
import type { EnrollmentRepository } from '../../domain/repositories/enrollment.repository.js';
import type { CreateEnrollmentDto, EnrollmentDto } from '../dto/enrollment.dto.js';
import { EnrollmentMapper } from '../mappers/enrollment.mapper.js';

export class CreateEnrollmentUseCase {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly trainingSessionRepository: TrainingSessionRepository,
    private readonly courseRepository: CourseRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    input: CreateEnrollmentDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<EnrollmentDto> {
    if (context.organizationId && context.organizationId !== input.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    const employee = await this.employeeRepository.findById(input.employeeId, input.organizationId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }
    const employeeProps = employee.toPrimitives();
    if (employeeProps.status !== 'ACTIVE') {
      throw new BadRequestError('Only active employees can be enrolled');
    }

    const trainingSession = await this.trainingSessionRepository.findById(
      input.trainingSessionId,
      input.organizationId,
    );
    if (!trainingSession) {
      throw new NotFoundError('Training session not found');
    }
    const trainingSessionProps = trainingSession.toPrimitives();
    if (trainingSessionProps.status !== 'PUBLISHED' && trainingSessionProps.status !== 'SCHEDULED') {
      throw new BadRequestError('Training session is not open for enrollment');
    }

    const course = await this.courseRepository.findById(
      trainingSessionProps.courseId,
      input.organizationId,
    );
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.toPrimitives().status !== 'ACTIVE') {
      throw new BadRequestError('Only active courses can receive enrollments');
    }

    const existing = await this.enrollmentRepository.findBySessionAndEmployee(
      input.organizationId,
      input.trainingSessionId,
      input.employeeId,
    );
    if (existing) {
      throw new ConflictError('Employee is already enrolled in this training session');
    }

    const enrollment = await this.enrollmentRepository.createWithCapacity({
      organizationId: input.organizationId,
      trainingSessionId: input.trainingSessionId,
      employeeId: input.employeeId,
      capacity: trainingSessionProps.capacity,
      occupiedStatuses: occupiedEnrollmentStatuses,
    });
    const created = EnrollmentMapper.toDto(enrollment);

    await this.auditLogger.record({
      organizationId: input.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'ENROLLMENT',
      entityId: enrollment.id,
      action: 'ENROLLMENT_CREATED',
      metadata: {
        trainingSessionId: input.trainingSessionId,
        employeeId: input.employeeId,
        status: created.status,
      },
      after: created,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return created;
  }
}
