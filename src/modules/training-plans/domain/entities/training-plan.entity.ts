import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';
import type { TrainingPlanItem } from './training-plan-item.entity.js';

export type TrainingPlanStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTING'
  | 'COMPLETED';

export interface TrainingPlanProps {
  id: string;
  organizationId: string;
  year: number;
  name: string;
  budgetAmount: number;
  currency: string;
  status: TrainingPlanStatus;
  submittedAt: Date | null;
  approvedAt: Date | null;
  items: TrainingPlanItem[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class TrainingPlan extends AggregateRoot<string> {
  private constructor(private readonly props: TrainingPlanProps) {
    super(props.id);
  }

  static create(input: {
    organizationId: string;
    year: number;
    name: string;
    budgetAmount: number;
    currency?: string | undefined;
  }): TrainingPlan {
    const now = new Date();

    return new TrainingPlan({
      id: randomUUID(),
      organizationId: input.organizationId,
      year: input.year,
      name: input.name,
      budgetAmount: input.budgetAmount,
      currency: input.currency ?? 'CLP',
      status: 'DRAFT',
      submittedAt: null,
      approvedAt: null,
      items: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: TrainingPlanProps): TrainingPlan {
    return new TrainingPlan(props);
  }

  update(input: {
    name?: string | undefined;
    budgetAmount?: number | undefined;
    currency?: string | undefined;
    status?: TrainingPlanStatus | undefined;
  }): void {
    Object.assign(this.props, {
      ...input,
      updatedAt: new Date(),
      version: this.props.version + 1,
    });
  }

  approve(): void {
    this.props.status = 'APPROVED';
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  reject(): void {
    this.props.status = 'REJECTED';
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  toPrimitives(): TrainingPlanProps {
    return { ...this.props, items: [...this.props.items] };
  }
}
