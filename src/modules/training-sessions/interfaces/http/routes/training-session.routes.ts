import { Router } from 'express';

import { validateBody } from '../../../../../shared/interfaces/http/validate-request.js';
import { JwtTokenService } from '../../../../auth/infrastructure/services/jwt-token.service.js';
import { requireAuth } from '../../../../auth/interfaces/http/middlewares/require-auth.middleware.js';
import { requirePermission } from '../../../../auth/interfaces/http/middlewares/require-permission.middleware.js';
import { CreateTrainingSessionUseCase } from '../../../application/use-cases/create-training-session.use-case.js';
import { GetTrainingSessionUseCase } from '../../../application/use-cases/get-training-session.use-case.js';
import { ListTrainingSessionsUseCase } from '../../../application/use-cases/list-training-sessions.use-case.js';
import { PublishTrainingSessionUseCase } from '../../../application/use-cases/publish-training-session.use-case.js';
import { UpdateTrainingSessionUseCase } from '../../../application/use-cases/update-training-session.use-case.js';
import { PrismaTrainingSessionRepository } from '../../../infrastructure/prisma/prisma-training-session.repository.js';
import { TrainingSessionController } from '../controllers/training-session.controller.js';
import {
  createTrainingSessionSchema,
  updateTrainingSessionSchema,
} from '../validators/training-session.validators.js';

export function createTrainingSessionRouter(): Router {
  const router = Router();
  const repository = new PrismaTrainingSessionRepository();
  const tokenService = new JwtTokenService();
  const controller = new TrainingSessionController(
    new ListTrainingSessionsUseCase(repository),
    new CreateTrainingSessionUseCase(repository),
    new GetTrainingSessionUseCase(repository),
    new UpdateTrainingSessionUseCase(repository),
    new PublishTrainingSessionUseCase(repository),
  );

  router.use('/training-sessions', requireAuth(tokenService));
  router.get('/training-sessions', requirePermission('training_sessions.read'), controller.list);
  router.post(
    '/training-sessions',
    requirePermission('training_sessions.create'),
    validateBody(createTrainingSessionSchema),
    controller.create,
  );
  router.get(
    '/training-sessions/:trainingSessionId',
    requirePermission('training_sessions.read'),
    controller.get,
  );
  router.patch(
    '/training-sessions/:trainingSessionId',
    requirePermission('training_sessions.update'),
    validateBody(updateTrainingSessionSchema),
    controller.update,
  );
  router.post(
    '/training-sessions/:trainingSessionId/publish',
    requirePermission('training_sessions.publish'),
    controller.publish,
  );

  return router;
}
