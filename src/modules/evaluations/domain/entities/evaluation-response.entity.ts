import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';
import type { JsonValue } from './evaluation-question.entity.js';

export interface EvaluationResponseProps {
  id: string;
  organizationId: string;
  evaluationId: string;
  enrollmentId: string | null;
  employeeId: string;
  score: number | null;
  passed: boolean | null;
  answersPayload: JsonValue | null;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class EvaluationResponseEntity extends AggregateRoot<string> {
  private constructor(private readonly props: EvaluationResponseProps) {
    super(props.id);
  }

  static create(input: {
    organizationId: string;
    evaluationId: string;
    enrollmentId?: string | null | undefined;
    employeeId: string;
    score?: number | null | undefined;
    passed?: boolean | null | undefined;
    answersPayload?: JsonValue | null | undefined;
  }): EvaluationResponseEntity {
    const now = new Date();

    return new EvaluationResponseEntity({
      id: randomUUID(),
      organizationId: input.organizationId,
      evaluationId: input.evaluationId,
      enrollmentId: input.enrollmentId ?? null,
      employeeId: input.employeeId,
      score: input.score ?? null,
      passed: input.passed ?? null,
      answersPayload: input.answersPayload ?? null,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: EvaluationResponseProps): EvaluationResponseEntity {
    return new EvaluationResponseEntity(props);
  }

  updateResult(input: { score: number; passed: boolean; answersPayload?: JsonValue | null }): void {
    this.props.score = input.score;
    this.props.passed = input.passed;
    this.props.answersPayload = input.answersPayload ?? this.props.answersPayload;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  toPrimitives(): EvaluationResponseProps {
    return { ...this.props };
  }
}
