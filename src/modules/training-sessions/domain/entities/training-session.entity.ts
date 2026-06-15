import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';
import { BadRequestError } from '../../../../shared/domain/errors.js';

export type TrainingSessionStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CLOSED';

export interface TrainingSessionProps {
  id: string;
  organizationId: string;
  courseId: string;
  trainingPlanItemId: string | null;
  providerId: string | null;
  instructorId: string | null;
  name: string;
  startDate: Date;
  endDate: Date;
  location: string | null;
  capacity: number;
  costAmount: number | null;
  meetingUrl: string | null;
  status: TrainingSessionStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class TrainingSession extends AggregateRoot<string> {
  private constructor(private readonly props: TrainingSessionProps) {
    super(props.id);
  }

  static create(input: {
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
  }): TrainingSession {
    ensureValidSchedule(input.startDate, input.endDate);
    ensureValidCapacity(input.capacity);
    const now = new Date();

    return new TrainingSession({
      id: randomUUID(),
      organizationId: input.organizationId,
      courseId: input.courseId,
      trainingPlanItemId: input.trainingPlanItemId ?? null,
      providerId: input.providerId ?? null,
      instructorId: input.instructorId ?? null,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      location: input.location ?? null,
      capacity: input.capacity,
      costAmount: input.costAmount ?? null,
      meetingUrl: input.meetingUrl ?? null,
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: TrainingSessionProps): TrainingSession {
    return new TrainingSession(props);
  }

  update(input: {
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
    deletedAt?: Date | null;
  }): void {
    const startDate = input.startDate ?? this.props.startDate;
    const endDate = input.endDate ?? this.props.endDate;
    ensureValidSchedule(startDate, endDate);
    if (input.capacity !== undefined) {
      ensureValidCapacity(input.capacity);
    }

    Object.assign(this.props, {
      ...input,
      startDate,
      endDate,
      updatedAt: new Date(),
      version: this.props.version + 1,
    });
  }

  publish(): void {
    if (this.props.status !== 'DRAFT' && this.props.status !== 'SCHEDULED') {
      throw new BadRequestError('Only draft or scheduled training sessions can be published');
    }

    this.props.status = 'PUBLISHED';
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  toPrimitives(): TrainingSessionProps {
    return { ...this.props };
  }
}

function ensureValidSchedule(startDate: Date, endDate: Date): void {
  if (endDate.getTime() <= startDate.getTime()) {
    throw new BadRequestError('Training session end date must be after start date');
  }
}

function ensureValidCapacity(capacity: number): void {
  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw new BadRequestError('Training session capacity must be greater than zero');
  }
}
