import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';
import { Email } from '../../../../domain/shared/value-objects/email.js';
import { Rut } from '../../../../domain/shared/value-objects/rut.js';
import { DateRange } from '../value-objects/date-range.js';

export interface LegalRepresentativeProps {
  id: string;
  organizationId: string;
  otecProfileId: string;
  firstName: string;
  lastName: string;
  taxId: string;
  email: string | null;
  phone: string | null;
  roleTitle: string;
  validFrom: Date | null;
  validUntil: Date | null;
  active: boolean;
  appointmentDocumentId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}
export class LegalRepresentative extends AggregateRoot<string> {
  private constructor(private readonly props: LegalRepresentativeProps) {
    super(props.id);
  }
  static create(input: {
    organizationId: string;
    otecProfileId: string;
    firstName: string;
    lastName: string;
    taxId: string;
    email?: string | null;
    phone?: string | null;
    roleTitle: string;
    validFrom?: Date | null;
    validUntil?: Date | null;
    appointmentDocumentId?: string | null;
    notes?: string | null;
  }): LegalRepresentative {
    const range = DateRange.create({
      validFrom: input.validFrom ?? null,
      validUntil: input.validUntil ?? null,
    });
    const required = normalizeRequired(input);
    const now = new Date();
    return new LegalRepresentative({
      id: randomUUID(),
      organizationId: input.organizationId,
      otecProfileId: input.otecProfileId,
      firstName: required.firstName,
      lastName: required.lastName,
      taxId: Rut.create(input.taxId).value,
      email: input.email ? Email.create(input.email).value : null,
      phone: input.phone ?? null,
      roleTitle: required.roleTitle,
      validFrom: range.validFrom,
      validUntil: range.validUntil,
      active: true,
      appointmentDocumentId: input.appointmentDocumentId ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }
  static rehydrate(props: LegalRepresentativeProps): LegalRepresentative {
    return new LegalRepresentative({ ...props });
  }
  update(
    input: {
      firstName?: string;
      lastName?: string;
      taxId?: string;
      email?: string | null;
      phone?: string | null;
      roleTitle?: string;
      validFrom?: Date | null;
      validUntil?: Date | null;
      appointmentDocumentId?: string | null;
      notes?: string | null;
    },
    now = new Date(),
  ): void {
    const range = DateRange.create({
      validFrom: input.validFrom === undefined ? this.props.validFrom : input.validFrom,
      validUntil: input.validUntil === undefined ? this.props.validUntil : input.validUntil,
    });
    for (const field of ['firstName', 'lastName', 'roleTitle'] as const)
      if (input[field] !== undefined && !input[field].trim())
        throw new Error(`${field} is required`);
    if (input.firstName !== undefined) this.props.firstName = input.firstName.trim();
    if (input.lastName !== undefined) this.props.lastName = input.lastName.trim();
    if (input.taxId !== undefined) this.props.taxId = Rut.create(input.taxId).value;
    if (input.email !== undefined)
      this.props.email = input.email ? Email.create(input.email).value : null;
    if (input.phone !== undefined) this.props.phone = input.phone;
    if (input.roleTitle !== undefined) this.props.roleTitle = input.roleTitle.trim();
    if (input.appointmentDocumentId !== undefined)
      this.props.appointmentDocumentId = input.appointmentDocumentId;
    if (input.notes !== undefined) this.props.notes = input.notes;
    this.props.validFrom = range.validFrom;
    this.props.validUntil = range.validUntil;
    this.props.updatedAt = now;
    this.props.version += 1;
  }
  deactivate(now = new Date()): void {
    if (this.props.deletedAt) throw new Error('The legal representative is already inactive');
    this.props.active = false;
    this.props.deletedAt = now;
    this.props.updatedAt = now;
    this.props.version += 1;
  }
  toPrimitives(): LegalRepresentativeProps {
    return { ...this.props };
  }
}
function normalizeRequired(input: { firstName: string; lastName: string; roleTitle: string }) {
  const values = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    roleTitle: input.roleTitle.trim(),
  };
  for (const [field, value] of Object.entries(values))
    if (!value) throw new Error(`${field} is required`);
  return values;
}
