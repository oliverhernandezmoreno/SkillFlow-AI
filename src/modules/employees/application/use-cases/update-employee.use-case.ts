import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { EmployeeRepository } from '../../domain/repositories/employee.repository.js';
import type { EmployeeDto, UpdateEmployeeDto } from '../dto/employee.dto.js';
import { EmployeeMapper } from '../mappers/employee.mapper.js';

export class UpdateEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(id: string, input: UpdateEmployeeDto): Promise<EmployeeDto> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    employee.update({
      organizationId: input.organizationId,
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
