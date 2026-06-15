import type { Enrollment } from '../../domain/entities/enrollment.entity.js';
import type { EnrollmentDto } from '../dto/enrollment.dto.js';

export class EnrollmentMapper {
  static toDto(enrollment: Enrollment): EnrollmentDto {
    const props = enrollment.toPrimitives();

    return {
      id: props.id,
      organizationId: props.organizationId,
      trainingSessionId: props.trainingSessionId,
      employeeId: props.employeeId,
      status: props.status,
      enrolledAt: props.enrolledAt.toISOString(),
      completionPercentage: props.completionPercentage,
      finalScore: props.finalScore,
      approved: props.approved,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
