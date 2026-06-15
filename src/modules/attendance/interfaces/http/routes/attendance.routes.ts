import { Router } from 'express';

import { PrismaAuditLogger } from '../../../../../shared/infrastructure/prisma/prisma-audit-logger.js';
import { validateBody } from '../../../../../shared/interfaces/http/validate-request.js';
import { JwtTokenService } from '../../../../auth/infrastructure/services/jwt-token.service.js';
import { requireAuth } from '../../../../auth/interfaces/http/middlewares/require-auth.middleware.js';
import { requirePermission } from '../../../../auth/interfaces/http/middlewares/require-permission.middleware.js';
import { PrismaEnrollmentRepository } from '../../../../enrollments/infrastructure/prisma/prisma-enrollment.repository.js';
import { PrismaTrainingSessionRepository } from '../../../../training-sessions/infrastructure/prisma/prisma-training-session.repository.js';
import { BulkAttendanceUseCase } from '../../../application/use-cases/bulk-attendance.use-case.js';
import { CalculateAttendanceMetricsUseCase } from '../../../application/use-cases/calculate-attendance-metrics.use-case.js';
import { CheckInUseCase } from '../../../application/use-cases/check-in.use-case.js';
import { CheckOutUseCase } from '../../../application/use-cases/check-out.use-case.js';
import { CreateAttendanceUseCase } from '../../../application/use-cases/create-attendance.use-case.js';
import { GetAttendanceUseCase } from '../../../application/use-cases/get-attendance.use-case.js';
import { ListAttendanceUseCase } from '../../../application/use-cases/list-attendance.use-case.js';
import { ListEmployeeAttendanceUseCase } from '../../../application/use-cases/list-employee-attendance.use-case.js';
import { ListSessionAttendanceUseCase } from '../../../application/use-cases/list-session-attendance.use-case.js';
import { UpdateAttendanceUseCase } from '../../../application/use-cases/update-attendance.use-case.js';
import { PrismaAttendanceRepository } from '../../../infrastructure/prisma/prisma-attendance.repository.js';
import { AttendanceController } from '../controllers/attendance.controller.js';
import {
  bulkAttendanceSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
} from '../validators/attendance.validators.js';

export function createAttendanceRouter(): Router {
  const router = Router();
  const attendanceRepository = new PrismaAttendanceRepository();
  const enrollmentRepository = new PrismaEnrollmentRepository();
  const trainingSessionRepository = new PrismaTrainingSessionRepository();
  const auditLogger = new PrismaAuditLogger();
  const tokenService = new JwtTokenService();
  const controller = new AttendanceController(
    new ListAttendanceUseCase(attendanceRepository),
    new CreateAttendanceUseCase(
      attendanceRepository,
      enrollmentRepository,
      trainingSessionRepository,
      auditLogger,
    ),
    new GetAttendanceUseCase(attendanceRepository),
    new UpdateAttendanceUseCase(attendanceRepository, auditLogger),
    new BulkAttendanceUseCase(
      attendanceRepository,
      enrollmentRepository,
      trainingSessionRepository,
      auditLogger,
    ),
    new CheckInUseCase(attendanceRepository, auditLogger),
    new CheckOutUseCase(attendanceRepository, auditLogger),
    new ListSessionAttendanceUseCase(attendanceRepository),
    new ListEmployeeAttendanceUseCase(attendanceRepository),
    new CalculateAttendanceMetricsUseCase(attendanceRepository, trainingSessionRepository),
  );

  router.use(requireAuth(tokenService));
  router.get('/attendance', requirePermission('attendance.read'), controller.list);
  router.post(
    '/attendance',
    requirePermission('attendance.create'),
    validateBody(createAttendanceSchema),
    controller.create,
  );
  router.post(
    '/attendance/bulk',
    requirePermission('attendance.bulk'),
    validateBody(bulkAttendanceSchema),
    controller.bulk,
  );
  router.get('/attendance/:attendanceId', requirePermission('attendance.read'), controller.get);
  router.put(
    '/attendance/:attendanceId',
    requirePermission('attendance.update'),
    validateBody(updateAttendanceSchema),
    controller.update,
  );
  router.post(
    '/attendance/:attendanceId/check-in',
    requirePermission('attendance.checkin'),
    controller.checkIn,
  );
  router.post(
    '/attendance/:attendanceId/check-out',
    requirePermission('attendance.checkout'),
    controller.checkOut,
  );
  router.get(
    '/attendance/:attendanceId/metrics',
    requirePermission('attendance.metrics'),
    controller.metrics,
  );
  router.get(
    '/training-sessions/:trainingSessionId/attendance',
    requirePermission('attendance.read'),
    controller.listBySession,
  );
  router.get(
    '/employees/:employeeId/attendance',
    requirePermission('attendance.read'),
    controller.listByEmployee,
  );

  return router;
}
