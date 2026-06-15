import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';

export type EvaluationType =
  | 'KNOWLEDGE'
  | 'KNOWLEDGE_TEST'
  | 'SATISFACTION'
  | 'SATISFACTION_SURVEY'
  | 'PRACTICAL'
  | 'PRACTICAL_ASSESSMENT'
  | 'DIAGNOSTIC';

export type EvaluationStatus = 'OPEN' | 'CLOSED';

export interface EvaluationProps {
  id: string;
  organizationId: string;
  trainingSessionId: string;
  type: EvaluationType;
  title: string;
  description: string | null;
  passingScore: number | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class Evaluation extends AggregateRoot<string> {
  private constructor(private readonly props: EvaluationProps) {
    super(props.id);
  }

  static create(input: {
    organizationId: string;
    trainingSessionId: string;
    type: EvaluationType;
    title: string;
    description?: string | null | undefined;
    passingScore?: number | null | undefined;
  }): Evaluation {
    const now = new Date();

    return new Evaluation({
      id: randomUUID(),
      organizationId: input.organizationId,
      trainingSessionId: input.trainingSessionId,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      passingScore: input.passingScore ?? null,
      closedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: EvaluationProps): Evaluation {
    return new Evaluation(props);
  }

  update(input: {
    type?: EvaluationType | undefined;
    title?: string | undefined;
    description?: string | null | undefined;
    passingScore?: number | null | undefined;
    closedAt?: Date | null | undefined;
    deletedAt?: Date | null | undefined;
  }): void {
    Object.assign(this.props, {
      ...input,
      updatedAt: new Date(),
      version: this.props.version + 1,
    });
  }

  close(): void {
    this.update({ closedAt: new Date() });
  }

  toPrimitives(): EvaluationProps {
    return { ...this.props };
  }
}
