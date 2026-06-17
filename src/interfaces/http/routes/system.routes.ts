import { Router } from 'express';

import type { Environment } from '../../../config/environment.js';
import type { BootstrapDemoUseCase } from '../../../application/system/use-cases/bootstrap-demo.use-case.js';
import { SystemController } from '../controllers/system.controller.js';

export function createSystemRouter(
  environment: Environment,
  bootstrapDemoUseCase?: BootstrapDemoUseCase,
): Router {
  const router = Router();
  const controller = new SystemController(environment, bootstrapDemoUseCase);

  router.post('/system/bootstrap-demo', controller.bootstrapDemo);

  return router;
}
