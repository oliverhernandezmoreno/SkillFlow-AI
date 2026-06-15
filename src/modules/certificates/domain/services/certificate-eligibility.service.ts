import { CERTIFICATE_MIN_ATTENDANCE_PERCENTAGE } from '../../application/config/certificate.config.js';
import type { CertificateEligibilityDto } from '../../application/dto/certificate.dto.js';
import type { CertificateEligibilitySnapshot } from '../repositories/certificate.repository.js';

export class CertificateEligibilityService {
  evaluate(snapshot: CertificateEligibilitySnapshot): CertificateEligibilityDto {
    const reasons: string[] = [];
    const enrollment = snapshot.enrollment;
    const trainingSession = snapshot.trainingSession;
    const course = snapshot.course;
    const attendance = snapshot.attendance;
    const minimumAttendancePercentage = CERTIFICATE_MIN_ATTENDANCE_PERCENTAGE;

    if (!enrollment) {
      reasons.push('Enrollment not found');
    }
    if (!snapshot.employee) {
      reasons.push('Employee not found');
    }
    if (!trainingSession) {
      reasons.push('Training session not found');
    }
    if (!course) {
      reasons.push('Course not found');
    }
    if (enrollment?.status === 'CANCELLED') {
      reasons.push('Enrollment is cancelled');
    }
    if (enrollment?.status === 'FAILED') {
      reasons.push('Enrollment is rejected');
    }
    if (!attendance) {
      reasons.push('Attendance record not found');
    }
    if (snapshot.existingCertificate) {
      reasons.push('Certificate already issued for this enrollment');
    }

    const attendancePercentage =
      attendance && trainingSession
        ? calculateAttendancePercentage(attendance.checkInAt, attendance.checkOutAt, trainingSession.startDate, trainingSession.endDate)
        : null;
    if (attendancePercentage !== null && attendancePercentage < minimumAttendancePercentage) {
      reasons.push('Attendance percentage is below the minimum required');
    }

    const closedEvaluations = snapshot.evaluations.filter((evaluation) => evaluation.closedAt !== null);
    const evaluationRequired = snapshot.evaluations.length > 0;
    const passedResponses = closedEvaluations
      .map((evaluation) => evaluation.response)
      .filter((response): response is { score: number | null; passed: boolean | null } => response !== null);
    const evaluationPassed = evaluationRequired
      ? passedResponses.length > 0 && passedResponses.some((response) => response.passed === true)
      : null;
    const evaluationScore =
      passedResponses.find((response) => response.passed === true)?.score ??
      passedResponses.find((response) => response.score !== null)?.score ??
      null;

    if (evaluationRequired && closedEvaluations.length === 0) {
      reasons.push('Evaluation is required and no closed evaluation exists');
    } else if (evaluationRequired && evaluationPassed !== true) {
      reasons.push('Evaluation is required and has not been passed');
    }

    return {
      eligible: reasons.length === 0,
      reasons,
      attendancePercentage,
      minimumAttendancePercentage,
      evaluationRequired,
      evaluationPassed,
      evaluationScore,
      enrollmentStatus: enrollment?.status ?? null,
      courseId: course?.id ?? trainingSession?.courseId ?? null,
      employeeId: enrollment?.employeeId ?? snapshot.employee?.id ?? null,
      trainingSessionId: enrollment?.trainingSessionId ?? trainingSession?.id ?? null,
    };
  }
}

function calculateAttendancePercentage(
  checkInAt: Date | null,
  checkOutAt: Date | null,
  sessionStartDate: Date,
  sessionEndDate: Date,
): number {
  if (!checkInAt || !checkOutAt) {
    return 0;
  }

  const sessionMinutes = Math.max(0, Math.floor((sessionEndDate.getTime() - sessionStartDate.getTime()) / 60000));
  const attendanceMinutes = Math.max(0, Math.floor((checkOutAt.getTime() - checkInAt.getTime()) / 60000));

  return sessionMinutes === 0 ? 0 : Math.min(100, Math.round((attendanceMinutes / sessionMinutes) * 100));
}
