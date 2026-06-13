import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'INVITED' | 'LOCKED';

export interface UserProps {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  roleIds: string[];
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class User extends AggregateRoot<string> {
  private constructor(private readonly props: UserProps) {
    super(props.id);
  }

  static create(input: {
    organizationId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    passwordHash: string;
    roleIds?: string[];
  }): User {
    const now = new Date();

    return new User({
      id: randomUUID(),
      organizationId: input.organizationId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      phone: input.phone ?? null,
      passwordHash: input.passwordHash,
      roleIds: input.roleIds ?? [],
      status: 'ACTIVE',
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: UserProps): User {
    return new User(props);
  }

  update(
    input: Partial<Pick<UserProps, 'firstName' | 'lastName' | 'phone' | 'status' | 'roleIds'>>,
  ): void {
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

  activate(): void {
    this.props.status = 'ACTIVE';
    this.props.deletedAt = null;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  changePassword(passwordHash: string): void {
    this.props.passwordHash = passwordHash;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  toPrimitives(): UserProps {
    return { ...this.props, roleIds: [...this.props.roleIds] };
  }
}
