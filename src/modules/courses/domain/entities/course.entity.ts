import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';

export type CourseModality = 'PRESENTIAL' | 'ONLINE' | 'HYBRID' | 'BLENDED' | 'ASYNC';
export type CourseStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface CourseProps {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string;
  modality: CourseModality;
  durationHours: number;
  status: CourseStatus;
  competencies: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class Course extends AggregateRoot<string> {
  private constructor(private readonly props: CourseProps) {
    super(props.id);
  }

  static create(input: {
    organizationId: string;
    code: string;
    name: string;
    description?: string | undefined;
    modality: CourseModality;
    durationHours: number;
    competencies?: string[] | undefined;
  }): Course {
    const now = new Date();

    return new Course({
      id: randomUUID(),
      organizationId: input.organizationId,
      code: input.code,
      name: input.name,
      description: input.description ?? '',
      modality: input.modality,
      durationHours: input.durationHours,
      status: 'DRAFT',
      competencies: input.competencies ?? [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: CourseProps): Course {
    return new Course(props);
  }

  update(input: {
    organizationId?: string | undefined;
    code?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    modality?: CourseModality | undefined;
    durationHours?: number | undefined;
    status?: CourseStatus | undefined;
    competencies?: string[] | undefined;
    deletedAt?: Date | null | undefined;
  }): void {
    Object.assign(this.props, {
      ...input,
      updatedAt: new Date(),
      version: this.props.version + 1,
    });
  }

  archive(): void {
    this.props.status = 'ARCHIVED';
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  toPrimitives(): CourseProps {
    return { ...this.props, competencies: [...this.props.competencies] };
  }
}
