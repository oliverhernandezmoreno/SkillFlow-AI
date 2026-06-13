import type { Request, Response } from 'express';

import { asyncHandler } from '../../../../../shared/interfaces/http/async-handler.js';
import {
  getOptionalQueryNumber,
  getOptionalQueryString,
  getRequiredParam,
} from '../../../../../shared/interfaces/http/request-values.js';
import type {
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '../../../application/dto/employee.dto.js';
import type { CreateEmployeeUseCase } from '../../../application/use-cases/create-employee.use-case.js';
import type { GetEmployeeUseCase } from '../../../application/use-cases/get-employee.use-case.js';
import type { ListEmployeesUseCase } from '../../../application/use-cases/list-employees.use-case.js';
import type { UpdateEmployeeUseCase } from '../../../application/use-cases/update-employee.use-case.js';

export class EmployeeController {
  constructor(
    private readonly listEmployeesUseCase: ListEmployeesUseCase,
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly getEmployeeUseCase: GetEmployeeUseCase,
    private readonly updateEmployeeUseCase: UpdateEmployeeUseCase,
  ) {}

  list = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const result = await this.listEmployeesUseCase.execute({
      organizationId: getOptionalQueryString(request, 'organizationId') ?? '',
      page: getOptionalQueryNumber(request, 'page'),
      pageSize: getOptionalQueryNumber(request, 'pageSize'),
      search: getOptionalQueryString(request, 'search'),
    });
    response.status(200).json(result);
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const result = await this.createEmployeeUseCase.execute(request.body as CreateEmployeeDto);
    response.status(201).json(result);
  });

  get = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const result = await this.getEmployeeUseCase.execute(getRequiredParam(request, 'employeeId'));
    response.status(200).json(result);
  });

  update = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const result = await this.updateEmployeeUseCase.execute(
      getRequiredParam(request, 'employeeId'),
      request.body as UpdateEmployeeDto,
    );
    response.status(200).json(result);
  });
}
