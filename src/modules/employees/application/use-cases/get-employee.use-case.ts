import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { EmployeeRepository } from '../../domain/repositories/employee.repository.js';
import type { EmployeeDto } from '../dto/employee.dto.js';
import { EmployeeMapper } from '../mappers/employee.mapper.js';

export class GetEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(id: string): Promise<EmployeeDto> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    return EmployeeMapper.toDto(employee);
  }
}
