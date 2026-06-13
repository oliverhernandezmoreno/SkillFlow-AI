import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';

export interface EmployeeProps {
  id: string;
  organizationId: string;
  rut: string;
  firstName: string;
  lastName: string;
  email: string | null;
  position: string;
  department: string;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class Employee extends AggregateRoot<string> {
  private constructor(private readonly props: EmployeeProps) {
    super(props.id);
  }

  static create(input: {
    organizationId: string;
    rut: string;
    firstName: string;
    lastName: string;
    email?: string | null | undefined;
    position?: string | undefined;
    department?: string | undefined;
  }): Employee {
    const now = new Date();

    return new Employee({
      id: randomUUID(),
      organizationId: input.organizationId,
      rut: input.rut,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email ?? null,
      position: input.position ?? 'Unassigned',
      department: input.department ?? 'Unassigned',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: EmployeeProps): Employee {
    return new Employee(props);
  }

  update(input: {
    organizationId?: string | undefined;
    rut?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    email?: string | null | undefined;
    position?: string | undefined;
    department?: string | undefined;
    status?: EmployeeStatus | undefined;
    deletedAt?: Date | null | undefined;
  }): void {
    Object.assign(this.props, {
      ...input,
      updatedAt: new Date(),
      version: this.props.version + 1,
    });
  }

  toPrimitives(): EmployeeProps {
    return { ...this.props };
  }
}
