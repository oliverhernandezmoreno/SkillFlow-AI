import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ConflictError, ForbiddenError } from '../../../../shared/domain/errors.js';
import { Employee } from '../../domain/entities/employee.entity.js';
import type { EmployeeRepository } from '../../domain/repositories/employee.repository.js';
import type { CreateEmployeeDto, EmployeeDto } from '../dto/employee.dto.js';
import { EmployeeMapper } from '../mappers/employee.mapper.js';

export class CreateEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(
    input: CreateEmployeeDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<EmployeeDto> {
    if (context.organizationId && context.organizationId !== input.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    const existing = await this.employeeRepository.findByRut(input.organizationId, input.documentNumber);
    if (existing) {
      throw new ConflictError('Employee document number already exists in organization');
    }

    const employee = Employee.create({
      organizationId: input.organizationId,
      rut: input.documentNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      position: input.positionName,
      department: input.areaName,
    });
    await this.employeeRepository.save(employee);

    return EmployeeMapper.toDto(employee);
  }
}
