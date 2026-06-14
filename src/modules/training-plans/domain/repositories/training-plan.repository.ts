import type { PaginatedResult, PaginationInput } from '../../../../shared/application/pagination.js';
import type { TrainingPlanItem } from '../entities/training-plan-item.entity.js';
import type { TrainingPlan, TrainingPlanStatus } from '../entities/training-plan.entity.js';

export interface TrainingPlanSearchFilters {
  organizationId: string;
  year?: number | undefined;
  status?: TrainingPlanStatus | undefined;
}

export interface TrainingPlanRepository {
  findById(id: string, organizationId: string): Promise<TrainingPlan | null>;
  findByOrganizationYear(organizationId: string, year: number): Promise<TrainingPlan | null>;
  search(
    filters: TrainingPlanSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<TrainingPlan>>;
  save(trainingPlan: TrainingPlan): Promise<void>;
  update(trainingPlan: TrainingPlan): Promise<void>;
  saveItem(item: TrainingPlanItem): Promise<void>;
}
