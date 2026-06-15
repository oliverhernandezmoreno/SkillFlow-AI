import { Router } from 'express';

import { PrismaAuditLogger } from '../../../../../shared/infrastructure/prisma/prisma-audit-logger.js';
import { validateBody } from '../../../../../shared/interfaces/http/validate-request.js';
import { PrismaAttendanceRepository } from '../../../../attendance/infrastructure/prisma/prisma-attendance.repository.js';
import { JwtTokenService } from '../../../../auth/infrastructure/services/jwt-token.service.js';
import { requireAuth } from '../../../../auth/interfaces/http/middlewares/require-auth.middleware.js';
import { requirePermission } from '../../../../auth/interfaces/http/middlewares/require-permission.middleware.js';
import { PrismaEnrollmentRepository } from '../../../../enrollments/infrastructure/prisma/prisma-enrollment.repository.js';
import { PrismaTrainingSessionRepository } from '../../../../training-sessions/infrastructure/prisma/prisma-training-session.repository.js';
import { AddEvaluationQuestionUseCase } from '../../../application/use-cases/add-evaluation-question.use-case.js';
import { CalculateEvaluationResultUseCase } from '../../../application/use-cases/calculate-evaluation-result.use-case.js';
import { CloseEvaluationUseCase } from '../../../application/use-cases/close-evaluation.use-case.js';
import { CreateEvaluationUseCase } from '../../../application/use-cases/create-evaluation.use-case.js';
import { GetEvaluationUseCase } from '../../../application/use-cases/get-evaluation.use-case.js';
import { ListEmployeeEvaluationsUseCase } from '../../../application/use-cases/list-employee-evaluations.use-case.js';
import { ListEnrollmentEvaluationsUseCase } from '../../../application/use-cases/list-enrollment-evaluations.use-case.js';
import { ListEvaluationsUseCase } from '../../../application/use-cases/list-evaluations.use-case.js';
import { ListSessionEvaluationsUseCase } from '../../../application/use-cases/list-session-evaluations.use-case.js';
import { SubmitEvaluationAnswerUseCase } from '../../../application/use-cases/submit-evaluation-answer.use-case.js';
import { SubmitEvaluationUseCase } from '../../../application/use-cases/submit-evaluation.use-case.js';
import { UpdateEvaluationQuestionUseCase } from '../../../application/use-cases/update-evaluation-question.use-case.js';
import { UpdateEvaluationUseCase } from '../../../application/use-cases/update-evaluation.use-case.js';
import { PrismaEvaluationRepository } from '../../../infrastructure/prisma/prisma-evaluation.repository.js';
import { EvaluationController } from '../controllers/evaluation.controller.js';
import {
  createEvaluationQuestionSchema,
  createEvaluationSchema,
  submitEvaluationAnswerSchema,
  submitEvaluationSchema,
  updateEvaluationQuestionSchema,
  updateEvaluationSchema,
} from '../validators/evaluation.validators.js';

export function createEvaluationRouter(): Router {
  const router = Router();
  const evaluationRepository = new PrismaEvaluationRepository();
  const trainingSessionRepository = new PrismaTrainingSessionRepository();
  const enrollmentRepository = new PrismaEnrollmentRepository();
  const attendanceRepository = new PrismaAttendanceRepository();
  const auditLogger = new PrismaAuditLogger();
  const tokenService = new JwtTokenService();
  const controller = new EvaluationController(
    new ListEvaluationsUseCase(evaluationRepository),
    new CreateEvaluationUseCase(evaluationRepository, trainingSessionRepository, auditLogger),
    new GetEvaluationUseCase(evaluationRepository),
    new UpdateEvaluationUseCase(evaluationRepository, auditLogger),
    new AddEvaluationQuestionUseCase(evaluationRepository, auditLogger),
    new UpdateEvaluationQuestionUseCase(evaluationRepository, auditLogger),
    new SubmitEvaluationUseCase(
      evaluationRepository,
      enrollmentRepository,
      attendanceRepository,
      auditLogger,
    ),
    new SubmitEvaluationAnswerUseCase(
      evaluationRepository,
      enrollmentRepository,
      attendanceRepository,
      auditLogger,
    ),
    new CloseEvaluationUseCase(evaluationRepository, auditLogger),
    new ListSessionEvaluationsUseCase(evaluationRepository),
    new ListEmployeeEvaluationsUseCase(evaluationRepository),
    new ListEnrollmentEvaluationsUseCase(evaluationRepository),
    new CalculateEvaluationResultUseCase(evaluationRepository, auditLogger),
  );

  router.use(requireAuth(tokenService));
  router.get('/evaluations', requirePermission('evaluations.read'), controller.list);
  router.post(
    '/evaluations',
    requirePermission('evaluations.create'),
    validateBody(createEvaluationSchema),
    controller.create,
  );
  router.get('/evaluations/:evaluationId', requirePermission('evaluations.read'), controller.get);
  router.put(
    '/evaluations/:evaluationId',
    requirePermission('evaluations.update'),
    validateBody(updateEvaluationSchema),
    controller.update,
  );
  router.post(
    '/evaluations/:evaluationId/questions',
    requirePermission('evaluations.update'),
    validateBody(createEvaluationQuestionSchema),
    controller.addQuestion,
  );
  router.put(
    '/evaluations/:evaluationId/questions/:questionId',
    requirePermission('evaluations.update'),
    validateBody(updateEvaluationQuestionSchema),
    controller.updateQuestion,
  );
  router.post(
    '/evaluations/:evaluationId/submit',
    requirePermission('evaluations.submit'),
    validateBody(submitEvaluationSchema),
    controller.submit,
  );
  router.post(
    '/evaluations/:evaluationId/answers',
    requirePermission('evaluations.submit'),
    validateBody(submitEvaluationAnswerSchema),
    controller.submitAnswer,
  );
  router.post(
    '/evaluations/:evaluationId/close',
    requirePermission('evaluations.close'),
    controller.close,
  );
  router.get(
    '/evaluations/:evaluationId/result',
    requirePermission('evaluations.result'),
    controller.result,
  );
  router.get(
    '/training-sessions/:trainingSessionId/evaluations',
    requirePermission('evaluations.read'),
    controller.listBySession,
  );
  router.get(
    '/employees/:employeeId/evaluations',
    requirePermission('evaluations.read'),
    controller.listByEmployee,
  );
  router.get(
    '/enrollments/:enrollmentId/evaluations',
    requirePermission('evaluations.read'),
    controller.listByEnrollment,
  );

  return router;
}
