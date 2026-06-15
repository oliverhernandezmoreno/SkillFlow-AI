import type { TrainingSessionStatus } from '../../domain/entities/training-session.entity.js';

export interface TrainingSessionDto {
  id: string;
  organizationId: string;
  courseId: string;
  trainingPlanItemId: string | null;
  providerId: string | null;
  instructorId: string | null;
  name: string;
  startDate: string;
  endDate: string;
  location: string | null;
  capacity: number;
  costAmount: number | null;
  meetingUrl: string | null;
  status: TrainingSessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainingSessionDto {
  organizationId: string;
  courseId: string;
  trainingPlanItemId?: string | null;
  providerId?: string | null;
  instructorId?: string | null;
  name: string;
  startDate: Date;
  endDate: Date;
  location?: string | null;
  capacity: number;
  costAmount?: number | null;
  meetingUrl?: string | null;
}

export interface UpdateTrainingSessionDto {
  courseId?: string;
  trainingPlanItemId?: string | null;
  providerId?: string | null;
  instructorId?: string | null;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string | null;
  capacity?: number;
  costAmount?: number | null;
  meetingUrl?: string | null;
  status?: TrainingSessionStatus;
}
