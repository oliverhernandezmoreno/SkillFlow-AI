import { randomUUID } from 'node:crypto';

export type TrainingPlanItemPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TrainingPlanItemProps {
  id: string;
  organizationId: string;
  trainingPlanId: string;
  courseId: string;
  plannedMonth: number | null;
  quarter: number | null;
  estimatedParticipants: number;
  estimatedCost: number;
  priority: TrainingPlanItemPriority;
  businessJustification: string | null;
  targetCompetencies: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class TrainingPlanItem {
  private constructor(private readonly props: TrainingPlanItemProps) {}

  static create(input: {
    organizationId: string;
    trainingPlanId: string;
    courseId: string;
    plannedMonth?: number | null | undefined;
    quarter?: number | null | undefined;
    estimatedParticipants: number;
    estimatedCost: number;
    priority?: TrainingPlanItemPriority | undefined;
    businessJustification?: string | null | undefined;
    targetCompetencies?: string[] | undefined;
  }): TrainingPlanItem {
    const now = new Date();

    return new TrainingPlanItem({
      id: randomUUID(),
      organizationId: input.organizationId,
      trainingPlanId: input.trainingPlanId,
      courseId: input.courseId,
      plannedMonth: input.plannedMonth ?? null,
      quarter: input.quarter ?? null,
      estimatedParticipants: input.estimatedParticipants,
      estimatedCost: input.estimatedCost,
      priority: input.priority ?? 'MEDIUM',
      businessJustification: input.businessJustification ?? null,
      targetCompetencies: input.targetCompetencies ?? [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: TrainingPlanItemProps): TrainingPlanItem {
    return new TrainingPlanItem(props);
  }

  toPrimitives(): TrainingPlanItemProps {
    return { ...this.props, targetCompetencies: [...this.props.targetCompetencies] };
  }
}
