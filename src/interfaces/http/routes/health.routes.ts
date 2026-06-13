import { Router } from 'express';

import { GetHealthStatusUseCase } from '../../../application/system/use-cases/get-health-status.use-case.js';
import { HealthController } from '../controllers/health.controller.js';

export function createHealthRouter(): Router {
  const router = Router();
  const controller = new HealthController(new GetHealthStatusUseCase());

  router.get('/health', controller.getHealth);

  return router;
}
