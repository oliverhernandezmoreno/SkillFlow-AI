import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';
import type { JsonValue } from './evaluation-question.entity.js';

export interface EvaluationAnswerProps {
  id: string;
  organizationId: string;
  evaluationResponseId: string;
  evaluationQuestionId: string;
  employeeId: string;
  answer: JsonValue;
  score: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class EvaluationAnswer extends AggregateRoot<string> {
  private constructor(private readonly props: EvaluationAnswerProps) {
    super(props.id);
  }

  static create(input: {
    organizationId: string;
    evaluationResponseId: string;
    evaluationQuestionId: string;
    employeeId: string;
    answer: JsonValue;
    score?: number | null | undefined;
  }): EvaluationAnswer {
    const now = new Date();

    return new EvaluationAnswer({
      id: randomUUID(),
      organizationId: input.organizationId,
      evaluationResponseId: input.evaluationResponseId,
      evaluationQuestionId: input.evaluationQuestionId,
      employeeId: input.employeeId,
      answer: input.answer,
      score: input.score ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: EvaluationAnswerProps): EvaluationAnswer {
    return new EvaluationAnswer(props);
  }

  toPrimitives(): EvaluationAnswerProps {
    return { ...this.props };
  }
}
