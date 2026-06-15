import { Router } from 'express';

import { createAuthRouter } from '../../../modules/auth/interfaces/http/routes/auth.routes.js';
import { createAttendanceRouter } from '../../../modules/attendance/interfaces/http/routes/attendance.routes.js';
import { createCourseRouter } from '../../../modules/courses/interfaces/http/routes/course.routes.js';
import { createEmployeeRouter } from '../../../modules/employees/interfaces/http/routes/employee.routes.js';
import { createEnrollmentRouter } from '../../../modules/enrollments/interfaces/http/routes/enrollment.routes.js';
import { createEvaluationRouter } from '../../../modules/evaluations/interfaces/http/routes/evaluation.routes.js';
import { createInstructorRouter } from '../../../modules/instructors/interfaces/http/routes/instructor.routes.js';
import { createOrganizationRouter } from '../../../modules/organizations/interfaces/http/routes/organization.routes.js';
import { createTrainingPlanRouter } from '../../../modules/training-plans/interfaces/http/routes/training-plan.routes.js';
import { createTrainingSessionRouter } from '../../../modules/training-sessions/interfaces/http/routes/training-session.routes.js';
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
  router.use(createInstructorRouter());
  router.use(createTrainingSessionRouter());
  router.use(createEnrollmentRouter());
  router.use(createAttendanceRouter());
  router.use(createEvaluationRouter());

  return router;
}
