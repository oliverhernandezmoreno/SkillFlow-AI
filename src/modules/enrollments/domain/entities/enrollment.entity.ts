import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';

export type EnrollmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'WAITLISTED'
  | 'ENROLLED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'FAILED';

export const occupiedEnrollmentStatuses: EnrollmentStatus[] = [
  'PENDING',
  'CONFIRMED',
  'ENROLLED',
  'COMPLETED',
];

export interface EnrollmentProps {
  id: string;
  organizationId: string;
  trainingSessionId: string;
  employeeId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completionPercentage: number | null;
  finalScore: number | null;
  approved: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class Enrollment extends AggregateRoot<string> {
  private constructor(private readonly props: EnrollmentProps) {
    super(props.id);
  }

  static create(input: {
    organizationId: string;
    trainingSessionId: string;
    employeeId: string;
    status: EnrollmentStatus;
  }): Enrollment {
    const now = new Date();

    return new Enrollment({
      id: randomUUID(),
      organizationId: input.organizationId,
      trainingSessionId: input.trainingSessionId,
      employeeId: input.employeeId,
      status: input.status,
      enrolledAt: now,
      completionPercentage: null,
      finalScore: null,
      approved: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: EnrollmentProps): Enrollment {
    return new Enrollment(props);
  }

  update(input: {
    status?: EnrollmentStatus | undefined;
    completionPercentage?: number | null | undefined;
    finalScore?: number | null | undefined;
    approved?: boolean | null | undefined;
    deletedAt?: Date | null | undefined;
  }): void {
    Object.assign(this.props, {
      ...input,
      updatedAt: new Date(),
      version: this.props.version + 1,
    });
  }

  confirm(): void {
    this.update({ status: 'CONFIRMED' });
  }

  reject(): void {
    this.update({ status: 'FAILED' });
  }

  cancel(): void {
    this.update({ status: 'CANCELLED' });
  }

  complete(): void {
    this.update({ status: 'COMPLETED', completionPercentage: 100, approved: true });
  }

  toPrimitives(): EnrollmentProps {
    return { ...this.props };
  }
}
