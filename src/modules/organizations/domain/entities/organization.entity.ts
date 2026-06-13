import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';

export type OrganizationType =
  | 'CLIENT'
  | 'CLIENT_COMPANY'
  | 'OTEC'
  | 'PROVIDER'
  | 'HOLDING'
  | 'INTERNAL';
export type OrganizationStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface OrganizationProps {
  id: string;
  legalName: string;
  tradeName: string | null;
  taxId: string;
  email: string;
  type: OrganizationType;
  status: OrganizationStatus;
  industry: string | null;
  country: string;
  settings: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class Organization extends AggregateRoot<string> {
  private constructor(private readonly props: OrganizationProps) {
    super(props.id);
  }

  static create(input: {
    legalName: string;
    tradeName?: string | null;
    taxId: string;
    email: string;
    type: OrganizationType;
    industry?: string | null | undefined;
    country?: string | undefined;
    settings?: Record<string, unknown> | null | undefined;
  }): Organization {
    const now = new Date();

    return new Organization({
      id: randomUUID(),
      legalName: input.legalName,
      tradeName: input.tradeName ?? null,
      taxId: input.taxId,
      email: input.email,
      type: input.type,
      status: 'ACTIVE',
      industry: input.industry ?? null,
      country: input.country ?? 'CL',
      settings: input.settings ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: OrganizationProps): Organization {
    return new Organization(props);
  }

  update(input: {
    legalName?: string | undefined;
    tradeName?: string | null | undefined;
    email?: string | undefined;
    type?: OrganizationType | undefined;
    industry?: string | null | undefined;
    country?: string | undefined;
    settings?: Record<string, unknown> | null | undefined;
    status?: OrganizationStatus | undefined;
  }): void {
    Object.assign(this.props, {
      ...input,
      updatedAt: new Date(),
      version: this.props.version + 1,
    });
  }

  deactivate(): void {
    this.props.status = 'INACTIVE';
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  toPrimitives(): OrganizationProps {
    return { ...this.props };
  }
}
