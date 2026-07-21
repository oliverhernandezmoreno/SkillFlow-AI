import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';
import { DateRange } from '../value-objects/date-range.js';
import { ConflictError } from '../../../../shared/domain/errors.js';

export type OtecAccreditationStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'CANCELLED';

export interface OtecAccreditationProps {
  id: string;
  organizationId: string;
  otecProfileId: string;
  accreditationType: string;
  accreditationNumber: string;
  status: OtecAccreditationStatus;
  issuedAt: Date | null;
  validFrom: Date | null;
  validUntil: Date | null;
  suspendedAt: Date | null;
  revokedAt: Date | null;
  issuingAuthority: string | null;
  source: string | null;
  externalReference: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class OtecAccreditation extends AggregateRoot<string> {
  private constructor(private readonly props: OtecAccreditationProps) {
    super(props.id);
  }

  static create(input: {
    organizationId: string;
    otecProfileId: string;
    accreditationType: string;
    accreditationNumber: string;
    issuedAt?: Date | null;
    validFrom?: Date | null;
    validUntil?: Date | null;
    issuingAuthority?: string | null;
    source?: string | null;
    externalReference?: string | null;
    notes?: string | null;
  }): OtecAccreditation {
    const range = DateRange.create({
      validFrom: input.validFrom ?? null,
      validUntil: input.validUntil ?? null,
    });
    const now = new Date();
    return new OtecAccreditation({
      id: randomUUID(),
      organizationId: input.organizationId,
      otecProfileId: input.otecProfileId,
      accreditationType: input.accreditationType,
      accreditationNumber: input.accreditationNumber,
      status: 'ACTIVE',
      issuedAt: input.issuedAt ?? null,
      validFrom: range.validFrom,
      validUntil: range.validUntil,
      suspendedAt: null,
      revokedAt: null,
      issuingAuthority: input.issuingAuthority ?? null,
      source: input.source ?? null,
      externalReference: input.externalReference ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: OtecAccreditationProps): OtecAccreditation {
    return new OtecAccreditation({ ...props });
  }
  update(
    input: {
      accreditationType?: string;
      accreditationNumber?: string;
      issuedAt?: Date | null;
      validFrom?: Date | null;
      validUntil?: Date | null;
      issuingAuthority?: string | null;
      source?: string | null;
      externalReference?: string | null;
      notes?: string | null;
    },
    at: Date = new Date(),
  ): void {
    if (this.props.status === 'REVOKED' || this.props.status === 'CANCELLED') {
      throw new ConflictError('A revoked or cancelled accreditation cannot be updated');
    }
    const range = DateRange.create({
      validFrom: input.validFrom === undefined ? this.props.validFrom : input.validFrom,
      validUntil: input.validUntil === undefined ? this.props.validUntil : input.validUntil,
    });
    if (input.accreditationType !== undefined)
      this.props.accreditationType = input.accreditationType;
    if (input.accreditationNumber !== undefined)
      this.props.accreditationNumber = input.accreditationNumber;
    if (input.issuedAt !== undefined) this.props.issuedAt = input.issuedAt;
    this.props.validFrom = range.validFrom;
    this.props.validUntil = range.validUntil;
    if (input.issuingAuthority !== undefined) this.props.issuingAuthority = input.issuingAuthority;
    if (input.source !== undefined) this.props.source = input.source;
    if (input.externalReference !== undefined)
      this.props.externalReference = input.externalReference;
    if (input.notes !== undefined) this.props.notes = input.notes;
    this.touch(at);
  }
  suspend(at: Date = new Date()): void {
    if (this.props.status !== 'ACTIVE' || (this.props.validUntil && this.props.validUntil < at)) {
      throw new ConflictError('Only a current active accreditation can be suspended');
    }
    this.props.status = 'SUSPENDED';
    this.props.suspendedAt = at;
    this.touch(at);
  }
  revoke(at: Date = new Date()): void {
    if (this.props.status !== 'ACTIVE' && this.props.status !== 'SUSPENDED') {
      throw new ConflictError('Only an active or suspended accreditation can be revoked');
    }
    this.props.status = 'REVOKED';
    this.props.revokedAt = at;
    this.touch(at);
  }
  toPrimitives(): OtecAccreditationProps {
    return { ...this.props };
  }
  private touch(at: Date): void {
    this.props.updatedAt = at;
    this.props.version += 1;
  }
}
