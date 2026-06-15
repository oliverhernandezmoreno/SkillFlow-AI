import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';

export type InstructorStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface InstructorProps {
  id: string;
  organizationId: string;
  userId: string | null;
  providerId: string | null;
  rut: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  normalizedEmail: string | null;
  phone: string | null;
  specialties: string[];
  status: InstructorStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class Instructor extends AggregateRoot<string> {
  private constructor(private readonly props: InstructorProps) {
    super(props.id);
  }

  static create(input: {
    organizationId: string;
    userId?: string | null;
    providerId?: string | null;
    rut?: string | null;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    specialties?: string[];
  }): Instructor {
    const now = new Date();
    const email = input.email ?? null;

    return new Instructor({
      id: randomUUID(),
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      providerId: input.providerId ?? null,
      rut: input.rut ?? null,
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      normalizedEmail: email ? normalizeEmail(email) : null,
      phone: input.phone ?? null,
      specialties: input.specialties ?? [],
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: InstructorProps): Instructor {
    return new Instructor(props);
  }

  update(input: {
    userId?: string | null;
    providerId?: string | null;
    rut?: string | null;
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    specialties?: string[];
    status?: InstructorStatus;
    deletedAt?: Date | null;
  }): void {
    const email = input.email === undefined ? this.props.email : input.email;
    Object.assign(this.props, {
      ...input,
      email,
      normalizedEmail: email ? normalizeEmail(email) : null,
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

  toPrimitives(): InstructorProps {
    return { ...this.props, specialties: [...this.props.specialties] };
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
