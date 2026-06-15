import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../../shared/domain/errors.js';
import type { Enrollment } from '../../../enrollments/domain/entities/enrollment.entity.js';
import type { EnrollmentRepository } from '../../../enrollments/domain/repositories/enrollment.repository.js';
import type { TrainingSession } from '../../../training-sessions/domain/entities/training-session.entity.js';
import type { TrainingSessionRepository } from '../../../training-sessions/domain/repositories/training-session.repository.js';

export function ensureContextOrganization(
  organizationId: string,
  context: UseCaseContext,
): void {
  if (context.organizationId && context.organizationId !== organizationId) {
    throw new ForbiddenError('Organization access denied');
  }
}

export async function loadAttendanceEnrollment(input: {
  enrollmentRepository: EnrollmentRepository;
  organizationId: string;
  enrollmentId: string;
  employeeId: string;
  trainingSessionId: string;
}): Promise<Enrollment> {
  const enrollment = await input.enrollmentRepository.findById(
    input.enrollmentId,
    input.organizationId,
  );
  if (!enrollment) {
    throw new NotFoundError('Enrollment not found');
  }

  const enrollmentProps = enrollment.toPrimitives();
  if (enrollmentProps.employeeId !== input.employeeId) {
    throw new BadRequestError('Attendance employee must match enrollment employee');
  }
  if (enrollmentProps.trainingSessionId !== input.trainingSessionId) {
    throw new BadRequestError('Attendance training session must match enrollment training session');
  }
  if (enrollmentProps.status === 'CANCELLED' || enrollmentProps.status === 'FAILED') {
    throw new BadRequestError('Attendance cannot be registered for inactive enrollments');
  }

  return enrollment;
}

export async function loadAttendanceTrainingSession(input: {
  trainingSessionRepository: TrainingSessionRepository;
  organizationId: string;
  trainingSessionId: string;
}): Promise<TrainingSession> {
  const trainingSession = await input.trainingSessionRepository.findById(
    input.trainingSessionId,
    input.organizationId,
  );
  if (!trainingSession) {
    throw new NotFoundError('Training session not found');
  }

  return trainingSession;
}

export function parseOptionalDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return new Date(value);
}
