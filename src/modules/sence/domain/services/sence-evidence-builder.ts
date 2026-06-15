import type { SenceEvidenceDto } from '../../application/dto/sence.dto.js';
import type { SenceComplianceSnapshot } from '../repositories/sence.repository.js';

export class SenceEvidenceBuilder {
  build(snapshot: SenceComplianceSnapshot): SenceEvidenceDto {
    const declarationProps = snapshot.declaration.toPrimitives();

    return {
      declarationId: declarationProps.id,
      trainingSessionId: declarationProps.trainingSessionId,
      evidence: [
        {
          type: 'SESSION_SUMMARY',
          metadata: {
            trainingSessionId: snapshot.trainingSession?.id ?? declarationProps.trainingSessionId,
            name: snapshot.trainingSession?.name ?? null,
            startDate: snapshot.trainingSession?.startDate.toISOString() ?? null,
            endDate: snapshot.trainingSession?.endDate.toISOString() ?? null,
            status: snapshot.trainingSession?.status ?? null,
          },
        },
        {
          type: 'PARTICIPANT_LIST',
          metadata: {
            participantCount: snapshot.participants.length,
            enrollmentIds: snapshot.participants.map((participant) => participant.enrollmentId),
          },
        },
        {
          type: 'ATTENDANCE_SUMMARY',
          metadata: {
            participantsWithAttendance: snapshot.participants.filter((participant) => participant.hasAttendance).length,
            averageAttendancePercentage: calculateAverageAttendance(snapshot),
          },
        },
        {
          type: 'CERTIFICATE_LIST',
          metadata: {
            participantsWithCertificates: snapshot.participants.filter((participant) => participant.hasCertificate).length,
          },
        },
        {
          type: 'EVALUATION_SUMMARY',
          metadata: {
            participantsWithEvaluation: snapshot.participants.filter((participant) => participant.hasEvaluation).length,
            participantsWithPassedEvaluation: snapshot.participants.filter((participant) => participant.evaluationPassed === true).length,
          },
        },
        {
          type: 'COURSE_METADATA',
          metadata: {
            courseId: snapshot.course?.id ?? null,
            code: snapshot.course?.code ?? null,
            name: snapshot.course?.name ?? null,
            modality: snapshot.course?.modality ?? null,
            durationHours: snapshot.course?.durationHours ?? null,
            senceCode: snapshot.course?.senceCode ?? null,
          },
        },
        {
          type: 'INSTRUCTOR_METADATA',
          metadata: {
            instructorId: snapshot.trainingSession?.instructorId ?? null,
            providerId: snapshot.trainingSession?.providerId ?? null,
          },
        },
      ],
    };
  }
}

function calculateAverageAttendance(snapshot: SenceComplianceSnapshot): number | null {
  const values = snapshot.participants
    .map((participant) => participant.attendancePercentage)
    .filter((value): value is number => value !== null);
  return values.length === 0
    ? null
    : Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}
