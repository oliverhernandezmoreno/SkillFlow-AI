import { describe, expect, it } from 'vitest';

import { ForbiddenError, NotFoundError } from '../../shared/domain/errors.js';
import { createEmployeeSchema } from './interfaces/http/validators/employee.validators.js';
import { CreateEmployeeUseCase } from './application/use-cases/create-employee.use-case.js';
import { GetEmployeeUseCase } from './application/use-cases/get-employee.use-case.js';
import type { EmployeeRepository } from './domain/repositories/employee.repository.js';
import type { Employee } from './domain/entities/employee.entity.js';

class FakeEmployeeRepository implements EmployeeRepository {
  employees: Employee[] = [];

  async findById(id: string, organizationId: string): Promise<Employee | null> {
    return (
      this.employees.find((employee) => {
        const props = employee.toPrimitives();
        return employee.id === id && props.organizationId === organizationId;
      }) ?? null
    );
  }

  async findByRut(organizationId: string, rut: string): Promise<Employee | null> {
    return (
      this.employees.find((employee) => {
        const props = employee.toPrimitives();
        return props.organizationId === organizationId && props.rut === rut;
      }) ?? null
    );
  }

  async search() {
    return { data: this.employees, meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
  }

  async save(employee: Employee): Promise<void> {
    this.employees.push(employee);
  }

  async update(employee: Employee): Promise<void> {
    const props = employee.toPrimitives();
    this.employees = this.employees.map((current) => {
      const currentProps = current.toPrimitives();
      return current.id === employee.id && currentProps.organizationId === props.organizationId
        ? employee
        : current;
    });
  }
}

describe('Employees module', () => {
  it('validates create employee input', () => {
    expect(() =>
      createEmployeeSchema.parse({
        organizationId: '11111111-1111-4111-8111-111111111111',
        documentNumber: '12.345.678-9',
        firstName: 'Ada',
        lastName: 'Lovelace',
      }),
    ).not.toThrow();
  });

  it('creates an employee using documentNumber as domain RUT', async () => {
    const result = await new CreateEmployeeUseCase(new FakeEmployeeRepository()).execute({
      organizationId: '11111111-1111-4111-8111-111111111111',
      documentNumber: '12.345.678-9',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(result.documentNumber).toBe('12.345.678-9');
  });

  it('rejects cross-tenant employee creation', async () => {
    await expect(
      new CreateEmployeeUseCase(new FakeEmployeeRepository()).execute(
        {
          organizationId: '11111111-1111-4111-8111-111111111111',
          documentNumber: '12.345.678-9',
          firstName: 'Ada',
          lastName: 'Lovelace',
        },
        { organizationId: '22222222-2222-4222-8222-222222222222', actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('does not read employees across tenants', async () => {
    const repository = new FakeEmployeeRepository();
    const created = await new CreateEmployeeUseCase(repository).execute({
      organizationId: '11111111-1111-4111-8111-111111111111',
      documentNumber: '12.345.678-9',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    await expect(
      new GetEmployeeUseCase(repository).execute(created.id, {
        organizationId: '22222222-2222-4222-8222-222222222222',
        actorUserId: null,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
