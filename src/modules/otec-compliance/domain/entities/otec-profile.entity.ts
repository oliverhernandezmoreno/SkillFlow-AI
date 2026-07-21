import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';
import { Email } from '../../../../domain/shared/value-objects/email.js';

export type OtecProfileStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CEASED';

export interface OtecProfileProps {
  id: string;
  organizationId: string;
  registrationCode: string | null;
  registrationStatus: OtecProfileStatus;
  rudoReference: string | null;
  accreditationDate: Date | null;
  suspensionDate: Date | null;
  cessationDate: Date | null;
  technicalContactName: string | null;
  technicalContactEmail: string | null;
  technicalContactPhone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class OtecProfile extends AggregateRoot<string> {
  private constructor(private readonly props: OtecProfileProps) {
    super(props.id);
  }

  static create(input: {
    organizationId: string;
    registrationCode?: string | null;
    rudoReference?: string | null;
    technicalContactName?: string | null;
    technicalContactEmail?: string | null;
    technicalContactPhone?: string | null;
    notes?: string | null;
  }): OtecProfile {
    const now = new Date();
    return new OtecProfile({
      id: randomUUID(),
      organizationId: input.organizationId,
      registrationCode: input.registrationCode ?? null,
      registrationStatus: 'ACTIVE',
      rudoReference: input.rudoReference ?? null,
      accreditationDate: null,
      suspensionDate: null,
      cessationDate: null,
      technicalContactName: input.technicalContactName ?? null,
      technicalContactEmail: normalizeOptionalEmail(input.technicalContactEmail),
      technicalContactPhone: input.technicalContactPhone ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: OtecProfileProps): OtecProfile {
    return new OtecProfile({ ...props });
  }

  update(input: {
    registrationCode?: string | null;
    rudoReference?: string | null;
    technicalContactName?: string | null;
    technicalContactEmail?: string | null;
    technicalContactPhone?: string | null;
    notes?: string | null;
  }): void {
    if (input.registrationCode !== undefined) this.props.registrationCode = input.registrationCode;
    if (input.rudoReference !== undefined) this.props.rudoReference = input.rudoReference;
    if (input.technicalContactName !== undefined) {
      this.props.technicalContactName = input.technicalContactName;
    }
    if (input.technicalContactEmail !== undefined) {
      this.props.technicalContactEmail = normalizeOptionalEmail(input.technicalContactEmail);
    }
    if (input.technicalContactPhone !== undefined) {
      this.props.technicalContactPhone = input.technicalContactPhone;
    }
    if (input.notes !== undefined) this.props.notes = input.notes;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  deactivate(): void {
    const now = new Date();
    this.props.registrationStatus = 'INACTIVE';
    this.props.deletedAt = now;
    this.props.updatedAt = now;
    this.props.version += 1;
  }

  toPrimitives(): OtecProfileProps {
    return { ...this.props };
  }
}

function normalizeOptionalEmail(email: string | null | undefined): string | null {
  return email ? Email.create(email).value : null;
}
