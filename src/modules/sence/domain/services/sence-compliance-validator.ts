import type { SenceComplianceValidationDto } from '../../application/dto/sence.dto.js';
import type { SenceComplianceSnapshot } from '../repositories/sence.repository.js';

export class SenceComplianceValidator {
  validate(snapshot: SenceComplianceSnapshot): SenceComplianceValidationDto {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingEvidence: string[] = [];
    const crossTenantIssues: string[] = [];

    if (!snapshot.trainingSession) {
      errors.push('Training session not found');
      missingEvidence.push('SESSION_SUMMARY');
    } else if (snapshot.trainingSession.status === 'CANCELLED') {
      errors.push('Training session is cancelled');
    }
    if (!snapshot.course) {
      errors.push('Course not found');
      missingEvidence.push('COURSE_METADATA');
    } else if (snapshot.course.status === 'INACTIVE' || snapshot.course.status === 'ARCHIVED') {
      errors.push('Course is inactive');
    }

    const participantCount = snapshot.participants.length;
    if (participantCount === 0) {
      errors.push('SENCE declaration requires at least one participant');
      missingEvidence.push('PARTICIPANT_LIST');
    }

    const participantsWithAttendance = snapshot.participants.filter((participant) => participant.hasAttendance).length;
    const participantsWithCertificates = snapshot.participants.filter((participant) => participant.hasCertificate).length;
    const participantsWithEvaluation = snapshot.participants.filter((participant) => participant.hasEvaluation).length;
    const attendanceValues = snapshot.participants
      .map((participant) => participant.attendancePercentage)
      .filter((value): value is number => value !== null);
    const averageAttendancePercentage =
      attendanceValues.length === 0
        ? null
        : Math.round(attendanceValues.reduce((total, value) => total + value, 0) / attendanceValues.length);

    for (const participant of snapshot.participants) {
      if (participant.crossTenantIssue) {
        crossTenantIssues.push(`Participant ${participant.employeeId} has cross-tenant data`);
      }
      if (!participant.hasAttendance && isDeclaredParticipantStatus(participant.enrollmentStatus)) {
        errors.push(`Participant ${participant.employeeId} is missing attendance`);
      }
      if (!participant.hasCertificate && participant.attendancePercentage !== null && participant.attendancePercentage >= 75) {
        errors.push(`Participant ${participant.employeeId} is missing an issued certificate`);
      }
    }
    if (participantsWithAttendance < participantCount) {
      missingEvidence.push('ATTENDANCE_SUMMARY');
    }
    if (participantsWithCertificates < participantCount) {
      missingEvidence.push('CERTIFICATE_LIST');
    }
    if (participantsWithEvaluation === 0) {
      warnings.push('No participant evaluation results were found');
    }
    if (crossTenantIssues.length > 0) {
      errors.push('Cross-tenant inconsistencies were detected');
    }

    const valid = errors.length === 0;
    return {
      valid,
      statusSuggestion: valid ? 'READY' : 'DRAFT',
      errors,
      warnings,
      participantCount,
      participantsWithAttendance,
      participantsWithCertificates,
      participantsWithEvaluation,
      averageAttendancePercentage,
      missingEvidence: [...new Set(missingEvidence)],
      crossTenantIssues,
    };
  }
}

function isDeclaredParticipantStatus(status: string): boolean {
  return status === 'CONFIRMED' || status === 'ENROLLED' || status === 'COMPLETED';
}
