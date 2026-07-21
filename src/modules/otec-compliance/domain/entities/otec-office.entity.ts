import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';
import { Email } from '../../../../domain/shared/value-objects/email.js';
import { DateRange } from '../value-objects/date-range.js';

export type OtecOfficeType =
  | 'HEADQUARTERS'
  | 'BRANCH'
  | 'OPERATING_OFFICE'
  | 'TRAINING_SITE'
  | 'OTHER';
export type OtecOfficeStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';
export interface OtecOfficeProps {
  id: string;
  organizationId: string;
  otecProfileId: string;
  officeCode: string;
  name: string;
  officeType: OtecOfficeType;
  status: OtecOfficeStatus;
  street: string;
  city: string;
  commune: string;
  region: string;
  country: string;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}
export class OtecOffice extends AggregateRoot<string> {
  private constructor(private readonly props: OtecOfficeProps) {
    super(props.id);
  }
  static create(input: {
    organizationId: string;
    otecProfileId: string;
    officeCode: string;
    name: string;
    officeType: OtecOfficeType;
    street: string;
    city: string;
    commune: string;
    region: string;
    country: string;
    postalCode?: string | null;
    email?: string | null;
    phone?: string | null;
    validFrom?: Date | null;
    validUntil?: Date | null;
    notes?: string | null;
  }): OtecOffice {
    const range = DateRange.create({
      validFrom: input.validFrom ?? null,
      validUntil: input.validUntil ?? null,
    });
    const required = normalizeRequired(input);
    const now = new Date();
    return new OtecOffice({
      id: randomUUID(),
      organizationId: input.organizationId,
      otecProfileId: input.otecProfileId,
      officeCode: required.officeCode.toUpperCase(),
      name: required.name,
      officeType: input.officeType,
      status: 'ACTIVE',
      street: required.street,
      city: required.city,
      commune: required.commune,
      region: required.region,
      country: required.country.toUpperCase(),
      postalCode: input.postalCode ?? null,
      email: input.email ? Email.create(input.email).value : null,
      phone: input.phone ?? null,
      validFrom: range.validFrom,
      validUntil: range.validUntil,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }
  static rehydrate(props: OtecOfficeProps): OtecOffice {
    return new OtecOffice({ ...props });
  }
  update(
    input: {
      officeCode?: string;
      name?: string;
      officeType?: OtecOfficeType;
      street?: string;
      city?: string;
      commune?: string;
      region?: string;
      country?: string;
      postalCode?: string | null;
      email?: string | null;
      phone?: string | null;
      validFrom?: Date | null;
      validUntil?: Date | null;
      notes?: string | null;
    },
    now = new Date(),
  ): void {
    const range = DateRange.create({
      validFrom: input.validFrom === undefined ? this.props.validFrom : input.validFrom,
      validUntil: input.validUntil === undefined ? this.props.validUntil : input.validUntil,
    });
    for (const field of [
      'officeCode',
      'name',
      'street',
      'city',
      'commune',
      'region',
      'country',
    ] as const) {
      if (input[field] !== undefined && !input[field].trim())
        throw new Error(`${field} is required`);
    }
    if (input.officeCode !== undefined)
      this.props.officeCode = input.officeCode.trim().toUpperCase();
    if (input.name !== undefined) this.props.name = input.name.trim();
    if (input.officeType !== undefined) this.props.officeType = input.officeType;
    if (input.street !== undefined) this.props.street = input.street.trim();
    if (input.city !== undefined) this.props.city = input.city.trim();
    if (input.commune !== undefined) this.props.commune = input.commune.trim();
    if (input.region !== undefined) this.props.region = input.region.trim();
    if (input.country !== undefined) this.props.country = input.country.trim().toUpperCase();
    if (input.postalCode !== undefined) this.props.postalCode = input.postalCode;
    if (input.email !== undefined)
      this.props.email = input.email ? Email.create(input.email).value : null;
    if (input.phone !== undefined) this.props.phone = input.phone;
    if (input.notes !== undefined) this.props.notes = input.notes;
    this.props.validFrom = range.validFrom;
    this.props.validUntil = range.validUntil;
    this.props.updatedAt = now;
    this.props.version += 1;
  }
  deactivate(now = new Date()): void {
    if (this.props.deletedAt) throw new Error('The OTEC office is already inactive');
    this.props.status = 'INACTIVE';
    this.props.deletedAt = now;
    this.props.updatedAt = now;
    this.props.version += 1;
  }
  toPrimitives(): OtecOfficeProps {
    return { ...this.props };
  }
}

function normalizeRequired(input: {
  officeCode: string;
  name: string;
  street: string;
  city: string;
  commune: string;
  region: string;
  country: string;
}) {
  const values = {
    officeCode: input.officeCode.trim(),
    name: input.name.trim(),
    street: input.street.trim(),
    city: input.city.trim(),
    commune: input.commune.trim(),
    region: input.region.trim(),
    country: input.country.trim(),
  };
  for (const [field, value] of Object.entries(values))
    if (!value) throw new Error(`${field} is required`);
  return values;
}
