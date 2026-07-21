import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';
import { BadRequestError } from '../../../../shared/domain/errors.js';
import { DateRange } from '../value-objects/date-range.js';

export type OtecResolutionType =
  | 'ACCREDITATION'
  | 'AUTHORIZATION'
  | 'MODIFICATION'
  | 'SUSPENSION'
  | 'CESSATION'
  | 'OTHER';
export type OtecResolutionStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'SUPERSEDED';
export interface OtecResolutionProps {
  id: string;
  organizationId: string;
  otecProfileId: string;
  resolutionType: OtecResolutionType;
  resolutionNumber: string;
  issuingAuthority: string;
  issuedAt: Date;
  validFrom: Date | null;
  validUntil: Date | null;
  status: OtecResolutionStatus;
  scope: string | null;
  supersedesResolutionId: string | null;
  documentId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}
export class OtecResolution extends AggregateRoot<string> {
  private constructor(private readonly props: OtecResolutionProps) {
    super(props.id);
  }
  static create(input: {
    organizationId: string;
    otecProfileId: string;
    resolutionType: OtecResolutionType;
    resolutionNumber: string;
    issuingAuthority: string;
    issuedAt: Date;
    validFrom?: Date | null;
    validUntil?: Date | null;
    scope?: string | null;
    documentId?: string | null;
    notes?: string | null;
  }): OtecResolution {
    const range = DateRange.create({
      validFrom: input.validFrom ?? null,
      validUntil: input.validUntil ?? null,
    });
    validateIssueDate(input.issuedAt, range.validFrom);
    const required = normalizeRequired(input);
    const now = new Date();
    return new OtecResolution({
      id: randomUUID(),
      organizationId: input.organizationId,
      otecProfileId: input.otecProfileId,
      resolutionType: input.resolutionType,
      resolutionNumber: required.resolutionNumber.toUpperCase(),
      issuingAuthority: required.issuingAuthority,
      issuedAt: input.issuedAt,
      validFrom: range.validFrom,
      validUntil: range.validUntil,
      status: 'ACTIVE',
      scope: input.scope ?? null,
      supersedesResolutionId: null,
      documentId: input.documentId ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }
  static rehydrate(props: OtecResolutionProps): OtecResolution {
    return new OtecResolution({ ...props });
  }
  updateAdministrativeData(
    input: {
      resolutionType?: OtecResolutionType;
      resolutionNumber?: string;
      issuingAuthority?: string;
      issuedAt?: Date;
      validFrom?: Date | null;
      validUntil?: Date | null;
      scope?: string | null;
      documentId?: string | null;
      notes?: string | null;
    },
    now = new Date(),
  ): void {
    const validFrom = input.validFrom === undefined ? this.props.validFrom : input.validFrom;
    const range = DateRange.create({
      validFrom,
      validUntil: input.validUntil === undefined ? this.props.validUntil : input.validUntil,
    });
    const issuedAt = input.issuedAt ?? this.props.issuedAt;
    validateIssueDate(issuedAt, range.validFrom);
    if (input.resolutionNumber !== undefined) {
      if (!input.resolutionNumber.trim()) throw new BadRequestError('resolutionNumber is required');
      this.props.resolutionNumber = input.resolutionNumber.trim().toUpperCase();
    }
    if (input.issuingAuthority !== undefined) {
      if (!input.issuingAuthority.trim()) throw new BadRequestError('issuingAuthority is required');
      this.props.issuingAuthority = input.issuingAuthority.trim();
    }
    if (input.resolutionType !== undefined) this.props.resolutionType = input.resolutionType;
    this.props.issuedAt = issuedAt;
    this.props.validFrom = range.validFrom;
    this.props.validUntil = range.validUntil;
    if (input.scope !== undefined) this.props.scope = input.scope;
    if (input.documentId !== undefined) this.props.documentId = input.documentId;
    if (input.notes !== undefined) this.props.notes = input.notes;
    this.props.updatedAt = now;
    this.props.version += 1;
  }
  supersede(resolutionId: string, now = new Date()): void {
    if (resolutionId === this.id) throw new BadRequestError('A resolution cannot supersede itself');
    if (this.props.status !== 'ACTIVE' || this.props.deletedAt)
      throw new BadRequestError('Only an active resolution can be used as a replacement');
    if (this.props.supersedesResolutionId)
      throw new BadRequestError('The replacement already belongs to a supersession chain');
    this.props.supersedesResolutionId = resolutionId;
    this.props.updatedAt = now;
    this.props.version += 1;
  }
  markSuperseded(now = new Date()): void {
    if (this.props.status !== 'ACTIVE' || this.props.deletedAt)
      throw new BadRequestError('Only an active resolution can be superseded');
    this.props.status = 'SUPERSEDED';
    this.props.updatedAt = now;
    this.props.version += 1;
  }
  deactivate(now = new Date()): void {
    if (this.props.status === 'SUPERSEDED')
      throw new BadRequestError('A superseded historical resolution cannot be deactivated');
    if (this.props.deletedAt) throw new BadRequestError('The OTEC resolution is already inactive');
    this.props.status = 'INACTIVE';
    this.props.deletedAt = now;
    this.props.updatedAt = now;
    this.props.version += 1;
  }
  toPrimitives(): OtecResolutionProps {
    return { ...this.props };
  }
}
function normalizeRequired(input: { resolutionNumber: string; issuingAuthority: string }) {
  const values = {
    resolutionNumber: input.resolutionNumber.trim(),
    issuingAuthority: input.issuingAuthority.trim(),
  };
  for (const [field, value] of Object.entries(values))
    if (!value) throw new BadRequestError(`${field} is required`);
  return values;
}
function validateIssueDate(issuedAt: Date, validFrom: Date | null): void {
  if (validFrom && issuedAt > validFrom)
    throw new BadRequestError('issuedAt cannot be after validFrom');
}
