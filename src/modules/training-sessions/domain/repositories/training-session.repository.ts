import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../shared/application/pagination.js';
import type {
  TrainingSession,
  TrainingSessionStatus,
} from '../entities/training-session.entity.js';

export interface TrainingSessionSearchFilters {
  organizationId: string;
  courseId?: string | undefined;
  status?: TrainingSessionStatus | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
}

export interface TrainingSessionRepository {
  findById(id: string, organizationId: string): Promise<TrainingSession | null>;
  search(
    filters: TrainingSessionSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<TrainingSession>>;
  save(trainingSession: TrainingSession): Promise<void>;
  update(trainingSession: TrainingSession): Promise<void>;
}
