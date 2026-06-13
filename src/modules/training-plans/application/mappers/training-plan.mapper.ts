import type { TrainingPlanItem } from '../../domain/entities/training-plan-item.entity.js';
import type { TrainingPlan } from '../../domain/entities/training-plan.entity.js';
import type { TrainingPlanDto, TrainingPlanItemDto } from '../dto/training-plan.dto.js';

export class TrainingPlanMapper {
  static toDto(trainingPlan: TrainingPlan): TrainingPlanDto {
    const props = trainingPlan.toPrimitives();

    return {
      id: props.id,
      organizationId: props.organizationId,
      name: props.name,
      year: props.year,
      status: props.status,
      budgetAmount: props.budgetAmount,
      currency: props.currency,
      submittedAt: props.submittedAt?.toISOString() ?? null,
      approvedAt: props.approvedAt?.toISOString() ?? null,
      items: props.items.map((item) => TrainingPlanMapper.itemToDto(item)),
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }

  static itemToDto(item: TrainingPlanItem): TrainingPlanItemDto {
    const props = item.toPrimitives();

    return {
      id: props.id,
      trainingPlanId: props.trainingPlanId,
      courseId: props.courseId,
      plannedMonth: props.plannedMonth,
      quarter: props.quarter,
      estimatedParticipants: props.estimatedParticipants,
      estimatedCost: props.estimatedCost,
      priority: props.priority,
      businessJustification: props.businessJustification,
      targetCompetencies: props.targetCompetencies,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
