import { Router } from 'express';

import type { Environment } from '../../../config/environment.js';
import { SystemController } from '../controllers/system.controller.js';

export function createSystemRouter(environment: Environment): Router {
  const router = Router();
  const controller = new SystemController(environment);

  router.post('/system/bootstrap-demo', controller.bootstrapDemo);

  return router;
}
