import { Router } from 'express';

import { validateBody } from '../../../../../shared/interfaces/http/validate-request.js';
import { JwtTokenService } from '../../../../auth/infrastructure/services/jwt-token.service.js';
import { requireAuth } from '../../../../auth/interfaces/http/middlewares/require-auth.middleware.js';
import { requirePermission } from '../../../../auth/interfaces/http/middlewares/require-permission.middleware.js';
import { CreateInstructorUseCase } from '../../../application/use-cases/create-instructor.use-case.js';
import { GetInstructorUseCase } from '../../../application/use-cases/get-instructor.use-case.js';
import { ListInstructorsUseCase } from '../../../application/use-cases/list-instructors.use-case.js';
import { UpdateInstructorUseCase } from '../../../application/use-cases/update-instructor.use-case.js';
import { PrismaInstructorRepository } from '../../../infrastructure/prisma/prisma-instructor.repository.js';
import { InstructorController } from '../controllers/instructor.controller.js';
import { createInstructorSchema, updateInstructorSchema } from '../validators/instructor.validators.js';

export function createInstructorRouter(): Router {
  const router = Router();
  const repository = new PrismaInstructorRepository();
  const tokenService = new JwtTokenService();
  const controller = new InstructorController(
    new ListInstructorsUseCase(repository),
    new CreateInstructorUseCase(repository),
    new GetInstructorUseCase(repository),
    new UpdateInstructorUseCase(repository),
  );

  router.use('/instructors', requireAuth(tokenService));
  router.get('/instructors', requirePermission('instructors.read'), controller.list);
  router.post(
    '/instructors',
    requirePermission('instructors.create'),
    validateBody(createInstructorSchema),
    controller.create,
  );
  router.get('/instructors/:instructorId', requirePermission('instructors.read'), controller.get);
  router.patch(
    '/instructors/:instructorId',
    requirePermission('instructors.update'),
    validateBody(updateInstructorSchema),
    controller.update,
  );

  return router;
}
