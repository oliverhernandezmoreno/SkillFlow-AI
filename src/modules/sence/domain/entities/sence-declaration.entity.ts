import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';
import { BadRequestError } from '../../../../shared/domain/errors.js';

export type SenceDeclarationStatus =
  | 'DRAFT'
  | 'READY'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'OBSERVED';

export interface SenceDeclarationProps {
  id: string;
  organizationId: string;
  trainingSessionId: string;
  senceCode: string | null;
  status: SenceDeclarationStatus;
  declaredAmount: number | null;
  taxCreditAmount: number | null;
  externalCode: string | null;
  submittedAt: Date | null;
  responsePayload: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class SenceDeclaration extends AggregateRoot<string> {
  private constructor(private readonly props: SenceDeclarationProps) {
    super(props.id);
  }

  static create(input: {
    organizationId: string;
    trainingSessionId: string;
    senceCode?: string | null | undefined;
    declaredAmount?: number | null | undefined;
    taxCreditAmount?: number | null | undefined;
    externalCode?: string | null | undefined;
  }): SenceDeclaration {
    const now = new Date();

    return new SenceDeclaration({
      id: randomUUID(),
      organizationId: input.organizationId,
      trainingSessionId: input.trainingSessionId,
      senceCode: input.senceCode ?? null,
      status: 'DRAFT',
      declaredAmount: input.declaredAmount ?? null,
      taxCreditAmount: input.taxCreditAmount ?? null,
      externalCode: input.externalCode ?? null,
      submittedAt: null,
      responsePayload: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: SenceDeclarationProps): SenceDeclaration {
    return new SenceDeclaration(props);
  }

  update(input: {
    senceCode?: string | null | undefined;
    declaredAmount?: number | null | undefined;
    taxCreditAmount?: number | null | undefined;
    externalCode?: string | null | undefined;
    responsePayload?: Record<string, unknown> | null | undefined;
  }): void {
    Object.assign(this.props, {
      ...input,
      updatedAt: new Date(),
      version: this.props.version + 1,
    });
  }

  markReady(metadata: Record<string, unknown>): void {
    if (this.props.status === 'SUBMITTED') {
      throw new BadRequestError('Submitted SENCE declarations cannot be marked ready');
    }
    this.props.status = 'READY';
    this.mergeResponsePayload(metadata);
  }

  submit(metadata: Record<string, unknown>): void {
    if (this.props.status !== 'READY') {
      throw new BadRequestError('Only ready SENCE declarations can be submitted');
    }
    this.props.status = 'SUBMITTED';
    this.props.submittedAt = new Date();
    this.mergeResponsePayload(metadata);
  }

  updateStatus(status: SenceDeclarationStatus, metadata: Record<string, unknown>): void {
    if (status === 'DRAFT' || status === 'READY' || status === 'SUBMITTED') {
      throw new BadRequestError('Use the dedicated workflow action for this SENCE declaration status');
    }
    this.props.status = status;
    this.mergeResponsePayload(metadata);
  }

  toPrimitives(): SenceDeclarationProps {
    return { ...this.props, responsePayload: cloneRecord(this.props.responsePayload) };
  }

  private mergeResponsePayload(metadata: Record<string, unknown>): void {
    this.props.responsePayload = {
      ...(this.props.responsePayload ?? {}),
      ...metadata,
    };
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }
}

function cloneRecord(value: Record<string, unknown> | null): Record<string, unknown> | null {
  return value ? { ...value } : null;
}
