import type { Employee } from '../../domain/entities/employee.entity.js';
import type { EmployeeDto } from '../dto/employee.dto.js';

export class EmployeeMapper {
  static toDto(employee: Employee): EmployeeDto {
    const props = employee.toPrimitives();

    return {
      id: props.id,
      organizationId: props.organizationId,
      documentNumber: props.rut,
      firstName: props.firstName,
      lastName: props.lastName,
      email: props.email,
      positionName: props.position,
      areaName: props.department,
      status: props.status,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
