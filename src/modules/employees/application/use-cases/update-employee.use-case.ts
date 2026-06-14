import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { EmployeeRepository } from '../../domain/repositories/employee.repository.js';
import type { EmployeeDto, UpdateEmployeeDto } from '../dto/employee.dto.js';
import { EmployeeMapper } from '../mappers/employee.mapper.js';

export class UpdateEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(
    id: string,
    input: UpdateEmployeeDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<EmployeeDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    const employee = await this.employeeRepository.findById(id, context.organizationId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }
    if (input.organizationId && input.organizationId !== context.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    employee.update({
      organizationId: context.organizationId,
      rut: input.documentNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      position: input.positionName,
      department: input.areaName,
      status: input.status,
    });
    await this.employeeRepository.update(employee);

    return EmployeeMapper.toDto(employee);
  }
}
