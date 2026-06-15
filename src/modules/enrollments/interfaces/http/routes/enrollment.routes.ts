import { Router } from 'express';

import { PrismaAuditLogger } from '../../../../../shared/infrastructure/prisma/prisma-audit-logger.js';
import { validateBody } from '../../../../../shared/interfaces/http/validate-request.js';
import { JwtTokenService } from '../../../../auth/infrastructure/services/jwt-token.service.js';
import { requireAuth } from '../../../../auth/interfaces/http/middlewares/require-auth.middleware.js';
import { requirePermission } from '../../../../auth/interfaces/http/middlewares/require-permission.middleware.js';
import { PrismaCourseRepository } from '../../../../courses/infrastructure/prisma/prisma-course.repository.js';
import { PrismaEmployeeRepository } from '../../../../employees/infrastructure/prisma/prisma-employee.repository.js';
import { PrismaTrainingSessionRepository } from '../../../../training-sessions/infrastructure/prisma/prisma-training-session.repository.js';
import { CancelEnrollmentUseCase } from '../../../application/use-cases/cancel-enrollment.use-case.js';
import { CompleteEnrollmentUseCase } from '../../../application/use-cases/complete-enrollment.use-case.js';
import { ConfirmEnrollmentUseCase } from '../../../application/use-cases/confirm-enrollment.use-case.js';
import { CreateEnrollmentUseCase } from '../../../application/use-cases/create-enrollment.use-case.js';
import { GetEnrollmentUseCase } from '../../../application/use-cases/get-enrollment.use-case.js';
import { ListEmployeeEnrollmentsUseCase } from '../../../application/use-cases/list-employee-enrollments.use-case.js';
import { ListEnrollmentsUseCase } from '../../../application/use-cases/list-enrollments.use-case.js';
import { ListSessionEnrollmentsUseCase } from '../../../application/use-cases/list-session-enrollments.use-case.js';
import { RejectEnrollmentUseCase } from '../../../application/use-cases/reject-enrollment.use-case.js';
import { UpdateEnrollmentUseCase } from '../../../application/use-cases/update-enrollment.use-case.js';
import { PrismaEnrollmentRepository } from '../../../infrastructure/prisma/prisma-enrollment.repository.js';
import { EnrollmentController } from '../controllers/enrollment.controller.js';
import { createEnrollmentSchema, updateEnrollmentSchema } from '../validators/enrollment.validators.js';

export function createEnrollmentRouter(): Router {
  const router = Router();
  const repository = new PrismaEnrollmentRepository();
  const auditLogger = new PrismaAuditLogger();
  const tokenService = new JwtTokenService();
  const controller = new EnrollmentController(
    new ListEnrollmentsUseCase(repository),
    new CreateEnrollmentUseCase(
      repository,
      new PrismaEmployeeRepository(),
      new PrismaTrainingSessionRepository(),
      new PrismaCourseRepository(),
      auditLogger,
    ),
    new GetEnrollmentUseCase(repository),
    new UpdateEnrollmentUseCase(repository),
    new ConfirmEnrollmentUseCase(repository, auditLogger),
    new RejectEnrollmentUseCase(repository, auditLogger),
    new CancelEnrollmentUseCase(repository, auditLogger),
    new CompleteEnrollmentUseCase(repository, auditLogger),
    new ListSessionEnrollmentsUseCase(repository),
    new ListEmployeeEnrollmentsUseCase(repository),
  );

  router.use(requireAuth(tokenService));
  router.get('/enrollments', requirePermission('enrollments.read'), controller.list);
  router.post(
    '/enrollments',
    requirePermission('enrollments.create'),
    validateBody(createEnrollmentSchema),
    controller.create,
  );
  router.get('/enrollments/:enrollmentId', requirePermission('enrollments.read'), controller.get);
  router.put(
    '/enrollments/:enrollmentId',
    requirePermission('enrollments.update'),
    validateBody(updateEnrollmentSchema),
    controller.update,
  );
  router.post(
    '/enrollments/:enrollmentId/confirm',
    requirePermission('enrollments.confirm'),
    controller.confirm,
  );
  router.post(
    '/enrollments/:enrollmentId/reject',
    requirePermission('enrollments.reject'),
    controller.reject,
  );
  router.post(
    '/enrollments/:enrollmentId/cancel',
    requirePermission('enrollments.cancel'),
    controller.cancel,
  );
  router.post(
    '/enrollments/:enrollmentId/complete',
    requirePermission('enrollments.complete'),
    controller.complete,
  );
  router.get(
    '/training-sessions/:trainingSessionId/enrollments',
    requirePermission('enrollments.read'),
    controller.listBySession,
  );
  router.get(
    '/employees/:employeeId/enrollments',
    requirePermission('enrollments.read'),
    controller.listByEmployee,
  );

  return router;
}
