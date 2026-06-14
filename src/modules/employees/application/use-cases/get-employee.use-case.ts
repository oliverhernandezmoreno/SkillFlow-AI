import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { EmployeeRepository } from '../../domain/repositories/employee.repository.js';
import type { EmployeeDto } from '../dto/employee.dto.js';
import { EmployeeMapper } from '../mappers/employee.mapper.js';

export class GetEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(
    id: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<EmployeeDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    const employee = await this.employeeRepository.findById(id, context.organizationId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    return EmployeeMapper.toDto(employee);
  }
}
