import { Router } from 'express';

import { validateBody } from '../../../../../shared/interfaces/http/validate-request.js';
import { CreateEmployeeUseCase } from '../../../application/use-cases/create-employee.use-case.js';
import { GetEmployeeUseCase } from '../../../application/use-cases/get-employee.use-case.js';
import { ListEmployeesUseCase } from '../../../application/use-cases/list-employees.use-case.js';
import { UpdateEmployeeUseCase } from '../../../application/use-cases/update-employee.use-case.js';
import { PrismaEmployeeRepository } from '../../../infrastructure/prisma/prisma-employee.repository.js';
import { EmployeeController } from '../controllers/employee.controller.js';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employee.validators.js';

export function createEmployeeRouter(): Router {
  const router = Router();
  const repository = new PrismaEmployeeRepository();
  const controller = new EmployeeController(
    new ListEmployeesUseCase(repository),
    new CreateEmployeeUseCase(repository),
    new GetEmployeeUseCase(repository),
    new UpdateEmployeeUseCase(repository),
  );

  router.get('/employees', controller.list);
  router.post('/employees', validateBody(createEmployeeSchema), controller.create);
  router.get('/employees/:employeeId', controller.get);
  router.patch('/employees/:employeeId', validateBody(updateEmployeeSchema), controller.update);

  return router;
}
