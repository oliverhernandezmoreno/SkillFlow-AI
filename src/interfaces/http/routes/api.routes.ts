import { Router } from 'express';

import { createAuthRouter } from '../../../modules/auth/interfaces/http/routes/auth.routes.js';
import { createCourseRouter } from '../../../modules/courses/interfaces/http/routes/course.routes.js';
import { createEmployeeRouter } from '../../../modules/employees/interfaces/http/routes/employee.routes.js';
import { createOrganizationRouter } from '../../../modules/organizations/interfaces/http/routes/organization.routes.js';
import { createTrainingPlanRouter } from '../../../modules/training-plans/interfaces/http/routes/training-plan.routes.js';
import { createUserRouter } from '../../../modules/users/interfaces/http/routes/user.routes.js';
import { createHealthRouter } from './health.routes.js';

export function createApiRouter(): Router {
  const router = Router();

  router.use(createHealthRouter());
  router.use(createAuthRouter());
  router.use(createOrganizationRouter());
  router.use(createUserRouter());
  router.use(createEmployeeRouter());
  router.use(createCourseRouter());
  router.use(createTrainingPlanRouter());

  return router;
}
