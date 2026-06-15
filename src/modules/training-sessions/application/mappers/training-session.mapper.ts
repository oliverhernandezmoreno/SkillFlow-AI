import type { TrainingSession } from '../../domain/entities/training-session.entity.js';
import type { TrainingSessionDto } from '../dto/training-session.dto.js';

export class TrainingSessionMapper {
  static toDto(trainingSession: TrainingSession): TrainingSessionDto {
    const props = trainingSession.toPrimitives();

    return {
      id: props.id,
      organizationId: props.organizationId,
      courseId: props.courseId,
      trainingPlanItemId: props.trainingPlanItemId,
      providerId: props.providerId,
      instructorId: props.instructorId,
      name: props.name,
      startDate: props.startDate.toISOString(),
      endDate: props.endDate.toISOString(),
      location: props.location,
      capacity: props.capacity,
      costAmount: props.costAmount,
      meetingUrl: props.meetingUrl,
      status: props.status,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
