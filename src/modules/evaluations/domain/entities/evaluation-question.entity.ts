import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';

export type EvaluationQuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TEXT'
  | 'NUMERIC'
  | 'SCALE'
  | 'BOOLEAN';

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface EvaluationQuestionProps {
  id: string;
  organizationId: string;
  evaluationId: string;
  type: EvaluationQuestionType;
  questionText: string;
  options: JsonValue | null;
  correctAnswer: JsonValue | null;
  points: number | null;
  orderIndex: number;
  required: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class EvaluationQuestion extends AggregateRoot<string> {
  private constructor(private readonly props: EvaluationQuestionProps) {
    super(props.id);
  }

  static create(input: {
    organizationId: string;
    evaluationId: string;
    type: EvaluationQuestionType;
    questionText: string;
    options?: JsonValue | null | undefined;
    correctAnswer?: JsonValue | null | undefined;
    points?: number | null | undefined;
    orderIndex: number;
    required?: boolean | undefined;
  }): EvaluationQuestion {
    const now = new Date();

    return new EvaluationQuestion({
      id: randomUUID(),
      organizationId: input.organizationId,
      evaluationId: input.evaluationId,
      type: input.type,
      questionText: input.questionText,
      options: input.options ?? null,
      correctAnswer: input.correctAnswer ?? null,
      points: input.points ?? null,
      orderIndex: input.orderIndex,
      required: input.required ?? true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: EvaluationQuestionProps): EvaluationQuestion {
    return new EvaluationQuestion(props);
  }

  update(input: {
    type?: EvaluationQuestionType | undefined;
    questionText?: string | undefined;
    options?: JsonValue | null | undefined;
    correctAnswer?: JsonValue | null | undefined;
    points?: number | null | undefined;
    orderIndex?: number | undefined;
    required?: boolean | undefined;
    deletedAt?: Date | null | undefined;
  }): void {
    Object.assign(this.props, {
      ...input,
      updatedAt: new Date(),
      version: this.props.version + 1,
    });
  }

  toPrimitives(): EvaluationQuestionProps {
    return { ...this.props };
  }
}
