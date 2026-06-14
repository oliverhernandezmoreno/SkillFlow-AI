import { Router } from 'express';

import { validateBody } from '../../../../../shared/interfaces/http/validate-request.js';
import { PrismaAuditLogger } from '../../../../../shared/infrastructure/prisma/prisma-audit-logger.js';
import { JwtTokenService } from '../../../../auth/infrastructure/services/jwt-token.service.js';
import { NodePasswordHasher } from '../../../../auth/infrastructure/services/node-password-hasher.js';
import { requireAuth } from '../../../../auth/interfaces/http/middlewares/require-auth.middleware.js';
import { requirePermission } from '../../../../auth/interfaces/http/middlewares/require-permission.middleware.js';
import { CreateUserUseCase } from '../../../application/use-cases/create-user.use-case.js';
import { DeactivateUserUseCase } from '../../../application/use-cases/deactivate-user.use-case.js';
import { GetUserUseCase } from '../../../application/use-cases/get-user.use-case.js';
import { ListUsersUseCase } from '../../../application/use-cases/list-users.use-case.js';
import { UpdateUserUseCase } from '../../../application/use-cases/update-user.use-case.js';
import { PrismaUserRepository } from '../../../infrastructure/prisma/prisma-user.repository.js';
import { UserController } from '../controllers/user.controller.js';
import { createUserSchema, updateUserSchema } from '../validators/user.validators.js';

export function createUserRouter(): Router {
  const router = Router();
  const repository = new PrismaUserRepository();
  const passwordHasher = new NodePasswordHasher();
  const auditLogger = new PrismaAuditLogger();
  const tokenService = new JwtTokenService();
  const controller = new UserController(
    new ListUsersUseCase(repository),
    new CreateUserUseCase(repository, passwordHasher, auditLogger),
    new GetUserUseCase(repository),
    new UpdateUserUseCase(repository, passwordHasher, auditLogger),
    new DeactivateUserUseCase(repository, auditLogger),
  );

  router.use('/users', requireAuth(tokenService));
  router.get('/users', requirePermission('users.read'), controller.list);
  router.post('/users', requirePermission('users.create'), validateBody(createUserSchema), controller.create);
  router.get('/users/:userId', requirePermission('users.read'), controller.get);
  router.put(
    '/users/:userId',
    requirePermission('users.update'),
    validateBody(updateUserSchema),
    controller.update,
  );
  router.patch(
    '/users/:userId',
    requirePermission('users.update'),
    validateBody(updateUserSchema),
    controller.update,
  );
  router.delete('/users/:userId', requirePermission('users.update'), controller.deactivate);

  return router;
}
