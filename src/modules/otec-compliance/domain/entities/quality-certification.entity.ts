import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';
import { DateRange } from '../value-objects/date-range.js';
import { ConflictError } from '../../../../shared/domain/errors.js';

export type QualityCertificationType = 'NCH_2728' | 'ISO_9001' | 'OTHER';
export type QualityCertificationStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'CANCELLED';
export interface QualityCertificationProps {
  id: string;
  organizationId: string;
  otecProfileId: string;
  certificationType: QualityCertificationType;
  certificationNumber: string;
  certifyingEntity: string;
  scope: string | null;
  issuedAt: Date | null;
  validFrom: Date | null;
  validUntil: Date | null;
  status: QualityCertificationStatus;
  documentId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}
export class QualityCertification extends AggregateRoot<string> {
  private constructor(private readonly props: QualityCertificationProps) {
    super(props.id);
  }
  static create(input: {
    organizationId: string;
    otecProfileId: string;
    certificationType: QualityCertificationType;
    certificationNumber: string;
    certifyingEntity: string;
    scope?: string | null;
    issuedAt?: Date | null;
    validFrom?: Date | null;
    validUntil?: Date | null;
    documentId?: string | null;
    notes?: string | null;
  }): QualityCertification {
    const range = DateRange.create({
      validFrom: input.validFrom ?? null,
      validUntil: input.validUntil ?? null,
    });
    const now = new Date();
    return new QualityCertification({
      id: randomUUID(),
      organizationId: input.organizationId,
      otecProfileId: input.otecProfileId,
      certificationType: input.certificationType,
      certificationNumber: input.certificationNumber,
      certifyingEntity: input.certifyingEntity,
      scope: input.scope ?? null,
      issuedAt: input.issuedAt ?? null,
      validFrom: range.validFrom,
      validUntil: range.validUntil,
      status: 'ACTIVE',
      documentId: input.documentId ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }
  static rehydrate(props: QualityCertificationProps): QualityCertification {
    return new QualityCertification({ ...props });
  }
  update(
    input: {
      certificationType?: QualityCertificationType;
      certificationNumber?: string;
      certifyingEntity?: string;
      scope?: string | null;
      issuedAt?: Date | null;
      validFrom?: Date | null;
      validUntil?: Date | null;
      documentId?: string | null;
      notes?: string | null;
    },
    at: Date = new Date(),
  ): void {
    if (this.props.status !== 'ACTIVE')
      throw new ConflictError('Only an active quality certification can be updated');
    const range = DateRange.create({
      validFrom: input.validFrom === undefined ? this.props.validFrom : input.validFrom,
      validUntil: input.validUntil === undefined ? this.props.validUntil : input.validUntil,
    });
    if (input.certificationType !== undefined)
      this.props.certificationType = input.certificationType;
    if (input.certificationNumber !== undefined)
      this.props.certificationNumber = input.certificationNumber;
    if (input.certifyingEntity !== undefined) this.props.certifyingEntity = input.certifyingEntity;
    if (input.scope !== undefined) this.props.scope = input.scope;
    if (input.issuedAt !== undefined) this.props.issuedAt = input.issuedAt;
    this.props.validFrom = range.validFrom;
    this.props.validUntil = range.validUntil;
    if (input.documentId !== undefined) this.props.documentId = input.documentId;
    if (input.notes !== undefined) this.props.notes = input.notes;
    this.props.updatedAt = at;
    this.props.version += 1;
  }
  deactivate(): void {
    if (this.props.status !== 'ACTIVE')
      throw new ConflictError('Only an active quality certification can be deactivated');
    const now = new Date();
    this.props.status = 'INACTIVE';
    this.props.deletedAt = now;
    this.props.updatedAt = now;
    this.props.version += 1;
  }
  toPrimitives(): QualityCertificationProps {
    return { ...this.props };
  }
}
