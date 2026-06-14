import type { PaginatedResult } from '../../../../shared/application/pagination.js';
import { createPagination } from '../../../../shared/application/pagination.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ForbiddenError } from '../../../../shared/domain/errors.js';
import type { EmployeeRepository } from '../../domain/repositories/employee.repository.js';
import type { EmployeeDto } from '../dto/employee.dto.js';
import { EmployeeMapper } from '../mappers/employee.mapper.js';

export class ListEmployeesUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(input: {
    organizationId: string;
    page?: number | undefined;
    pageSize?: number | undefined;
    search?: string | undefined;
  },
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<PaginatedResult<EmployeeDto>> {
    if (context.organizationId && context.organizationId !== input.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    const result = await this.employeeRepository.search(
      { organizationId: input.organizationId, search: input.search },
      createPagination(input),
    );

    return { data: result.data.map(EmployeeMapper.toDto), meta: result.meta };
  }
}
