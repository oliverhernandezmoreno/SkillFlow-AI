import type {
  TrainingPlanItemPriority,
} from '../../domain/entities/training-plan-item.entity.js';
import type { TrainingPlanStatus } from '../../domain/entities/training-plan.entity.js';

export interface TrainingPlanItemDto {
  id: string;
  trainingPlanId: string;
  courseId: string;
  plannedMonth: number | null;
  quarter: number | null;
  estimatedParticipants: number;
  estimatedCost: number;
  priority: TrainingPlanItemPriority;
  businessJustification: string | null;
  targetCompetencies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPlanDto {
  id: string;
  organizationId: string;
  name: string;
  year: number;
  status: TrainingPlanStatus;
  budgetAmount: number;
  currency: string;
  submittedAt: string | null;
  approvedAt: string | null;
  items: TrainingPlanItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainingPlanDto {
  organizationId: string;
  name: string;
  year: number;
  budgetAmount: number;
  currency?: string | undefined;
}

export interface UpdateTrainingPlanDto {
  name?: string | undefined;
  status?: TrainingPlanStatus | undefined;
  budgetAmount?: number | undefined;
  currency?: string | undefined;
}

export interface CreateTrainingPlanItemDto {
  courseId: string;
  plannedMonth?: number | null | undefined;
  quarter?: number | null | undefined;
  estimatedParticipants: number;
  estimatedCost: number;
  priority?: TrainingPlanItemPriority | undefined;
  businessJustification?: string | null | undefined;
  targetCompetencies?: string[] | undefined;
}
