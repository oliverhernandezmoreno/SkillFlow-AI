import { Router } from 'express';

import { PrismaAuditLogger } from '../../../../../shared/infrastructure/prisma/prisma-audit-logger.js';
import { validateBody } from '../../../../../shared/interfaces/http/validate-request.js';
import { JwtTokenService } from '../../../../auth/infrastructure/services/jwt-token.service.js';
import { requireAuth } from '../../../../auth/interfaces/http/middlewares/require-auth.middleware.js';
import { requirePermission } from '../../../../auth/interfaces/http/middlewares/require-permission.middleware.js';
import { ApproveTrainingPlanUseCase } from '../../../application/use-cases/approve-training-plan.use-case.js';
import { CreateTrainingPlanItemUseCase } from '../../../application/use-cases/create-training-plan-item.use-case.js';
import { CreateTrainingPlanUseCase } from '../../../application/use-cases/create-training-plan.use-case.js';
import { GetTrainingPlanUseCase } from '../../../application/use-cases/get-training-plan.use-case.js';
import { ListTrainingPlansUseCase } from '../../../application/use-cases/list-training-plans.use-case.js';
import { RejectTrainingPlanUseCase } from '../../../application/use-cases/reject-training-plan.use-case.js';
import { UpdateTrainingPlanUseCase } from '../../../application/use-cases/update-training-plan.use-case.js';
import { PrismaTrainingPlanRepository } from '../../../infrastructure/prisma/prisma-training-plan.repository.js';
import { TrainingPlanController } from '../controllers/training-plan.controller.js';
import {
  createTrainingPlanItemSchema,
  createTrainingPlanSchema,
  updateTrainingPlanSchema,
} from '../validators/training-plan.validators.js';

export function createTrainingPlanRouter(): Router {
  const router = Router();
  const repository = new PrismaTrainingPlanRepository();
  const auditLogger = new PrismaAuditLogger();
  const tokenService = new JwtTokenService();
  const controller = new TrainingPlanController(
    new ListTrainingPlansUseCase(repository),
    new CreateTrainingPlanUseCase(repository, auditLogger),
    new GetTrainingPlanUseCase(repository),
    new UpdateTrainingPlanUseCase(repository, auditLogger),
    new ApproveTrainingPlanUseCase(repository, auditLogger),
    new RejectTrainingPlanUseCase(repository, auditLogger),
    new CreateTrainingPlanItemUseCase(repository),
  );

  router.use('/training-plans', requireAuth(tokenService));
  router.get('/training-plans', requirePermission('training_plan.read'), controller.list);
  router.post(
    '/training-plans',
    requirePermission('training_plan.create'),
    validateBody(createTrainingPlanSchema),
    controller.create,
  );
  router.get(
    '/training-plans/:trainingPlanId',
    requirePermission('training_plan.read'),
    controller.get,
  );
  router.patch(
    '/training-plans/:trainingPlanId',
    requirePermission('training_plan.update'),
    validateBody(updateTrainingPlanSchema),
    controller.update,
  );
  router.post(
    '/training-plans/:trainingPlanId/approve',
    requirePermission('training_plan.approve'),
    controller.approve,
  );
  router.post(
    '/training-plans/:trainingPlanId/reject',
    requirePermission('training_plan.approve'),
    controller.reject,
  );
  router.post(
    '/training-plans/:trainingPlanId/items',
    requirePermission('training_plan.update'),
    validateBody(createTrainingPlanItemSchema),
    controller.createItem,
  );

  return router;
}
