import { Router } from 'express';

import { validateBody } from '../../../../../shared/interfaces/http/validate-request.js';
import { JwtTokenService } from '../../../../auth/infrastructure/services/jwt-token.service.js';
import { requireAuth } from '../../../../auth/interfaces/http/middlewares/require-auth.middleware.js';
import { requirePermission } from '../../../../auth/interfaces/http/middlewares/require-permission.middleware.js';
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
  const tokenService = new JwtTokenService();
  const controller = new EmployeeController(
    new ListEmployeesUseCase(repository),
    new CreateEmployeeUseCase(repository),
    new GetEmployeeUseCase(repository),
    new UpdateEmployeeUseCase(repository),
  );

  router.use('/employees', requireAuth(tokenService));
  router.get('/employees', requirePermission('employees.read'), controller.list);
  router.post(
    '/employees',
    requirePermission('employees.create'),
    validateBody(createEmployeeSchema),
    controller.create,
  );
  router.get('/employees/:employeeId', requirePermission('employees.read'), controller.get);
  router.patch(
    '/employees/:employeeId',
    requirePermission('employees.update'),
    validateBody(updateEmployeeSchema),
    controller.update,
  );

  return router;
}
