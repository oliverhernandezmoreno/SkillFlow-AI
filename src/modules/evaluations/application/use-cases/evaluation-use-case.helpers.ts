import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../../shared/domain/errors.js';
import type { AttendanceRepository } from '../../../attendance/domain/repositories/attendance.repository.js';
import type { Enrollment } from '../../../enrollments/domain/entities/enrollment.entity.js';
import type { EnrollmentRepository } from '../../../enrollments/domain/repositories/enrollment.repository.js';
import type { Evaluation } from '../../domain/entities/evaluation.entity.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';

export function ensureEvaluationOrganization(
  organizationId: string,
  context: UseCaseContext,
): void {
  if (context.organizationId && context.organizationId !== organizationId) {
    throw new ForbiddenError('Organization access denied');
  }
}

export async function loadEvaluation(input: {
  evaluationRepository: EvaluationRepository;
  evaluationId: string;
  organizationId: string;
}): Promise<Evaluation> {
  const evaluation = await input.evaluationRepository.findById(
    input.evaluationId,
    input.organizationId,
  );
  if (!evaluation) {
    throw new NotFoundError('Evaluation not found');
  }
  return evaluation;
}

export async function validateParticipant(input: {
  enrollmentRepository: EnrollmentRepository;
  attendanceRepository: AttendanceRepository;
  organizationId: string;
  enrollmentId: string | null | undefined;
  employeeId: string;
  trainingSessionId: string;
}): Promise<Enrollment | null> {
  if (!input.enrollmentId) {
    return null;
  }

  const enrollment = await input.enrollmentRepository.findById(
    input.enrollmentId,
    input.organizationId,
  );
  if (!enrollment) {
    throw new NotFoundError('Enrollment not found');
  }

  const enrollmentProps = enrollment.toPrimitives();
  if (enrollmentProps.employeeId !== input.employeeId) {
    throw new BadRequestError('Evaluation employee must match enrollment employee');
  }
  if (enrollmentProps.trainingSessionId !== input.trainingSessionId) {
    throw new BadRequestError('Evaluation training session must match enrollment training session');
  }
  if (enrollmentProps.status === 'CANCELLED' || enrollmentProps.status === 'FAILED') {
    throw new BadRequestError('Evaluation cannot be submitted for inactive enrollments');
  }

  const attendanceRecord = await input.attendanceRepository.findByEnrollment(
    input.organizationId,
    input.enrollmentId,
  );
  if (!attendanceRecord) {
    throw new BadRequestError('Attendance is required before submitting an individual evaluation');
  }

  return enrollment;
}
