import type { Request, Response } from 'express';

import type { AuthenticatedLocals } from '../../../../auth/interfaces/http/auth-context.js';
import { createUseCaseContext } from '../../../../auth/interfaces/http/auth-request-context.js';
import { UnauthorizedError } from '../../../../../shared/domain/errors.js';
import { asyncHandler } from '../../../../../shared/interfaces/http/async-handler.js';
import {
  getOptionalQueryNumber,
  getOptionalQueryString,
  getRequiredParam,
} from '../../../../../shared/interfaces/http/request-values.js';
import type {
  BulkAttendanceDto,
  CreateAttendanceDto,
  UpdateAttendanceDto,
} from '../../../application/dto/attendance.dto.js';
import type { BulkAttendanceUseCase } from '../../../application/use-cases/bulk-attendance.use-case.js';
import type { CalculateAttendanceMetricsUseCase } from '../../../application/use-cases/calculate-attendance-metrics.use-case.js';
import type { CheckInUseCase } from '../../../application/use-cases/check-in.use-case.js';
import type { CheckOutUseCase } from '../../../application/use-cases/check-out.use-case.js';
import type { CreateAttendanceUseCase } from '../../../application/use-cases/create-attendance.use-case.js';
import type { GetAttendanceUseCase } from '../../../application/use-cases/get-attendance.use-case.js';
import type { ListAttendanceUseCase } from '../../../application/use-cases/list-attendance.use-case.js';
import type { ListEmployeeAttendanceUseCase } from '../../../application/use-cases/list-employee-attendance.use-case.js';
import type { ListSessionAttendanceUseCase } from '../../../application/use-cases/list-session-attendance.use-case.js';
import type { UpdateAttendanceUseCase } from '../../../application/use-cases/update-attendance.use-case.js';
import type { AttendanceStatus } from '../../../domain/entities/attendance-record.entity.js';

export class AttendanceController {
  constructor(
    private readonly listAttendanceUseCase: ListAttendanceUseCase,
    private readonly createAttendanceUseCase: CreateAttendanceUseCase,
    private readonly getAttendanceUseCase: GetAttendanceUseCase,
    private readonly updateAttendanceUseCase: UpdateAttendanceUseCase,
    private readonly bulkAttendanceUseCase: BulkAttendanceUseCase,
    private readonly checkInUseCase: CheckInUseCase,
    private readonly checkOutUseCase: CheckOutUseCase,
    private readonly listSessionAttendanceUseCase: ListSessionAttendanceUseCase,
    private readonly listEmployeeAttendanceUseCase: ListEmployeeAttendanceUseCase,
    private readonly calculateAttendanceMetricsUseCase: CalculateAttendanceMetricsUseCase,
  ) {}

  list = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const organizationId =
        getOptionalQueryString(request, 'organizationId') ?? response.locals.auth?.organizationId;
      if (!organizationId) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await this.listAttendanceUseCase.execute(
        {
          organizationId,
          page: getOptionalQueryNumber(request, 'page'),
          pageSize: getOptionalQueryNumber(request, 'pageSize'),
          enrollmentId: getOptionalQueryString(request, 'enrollmentId'),
          trainingSessionId: getOptionalQueryString(request, 'trainingSessionId'),
          employeeId: getOptionalQueryString(request, 'employeeId'),
          status: getOptionalQueryString(request, 'status') as AttendanceStatus | undefined,
        },
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  create = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.createAttendanceUseCase.execute(
        request.body as CreateAttendanceDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  get = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.getAttendanceUseCase.execute(
        getRequiredParam(request, 'attendanceId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  update = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.updateAttendanceUseCase.execute(
        getRequiredParam(request, 'attendanceId'),
        request.body as UpdateAttendanceDto,
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  bulk = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.bulkAttendanceUseCase.execute(
        request.body as BulkAttendanceDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  checkIn = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.checkInUseCase.execute(
        getRequiredParam(request, 'attendanceId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  checkOut = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.checkOutUseCase.execute(
        getRequiredParam(request, 'attendanceId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  listBySession = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.listSessionAttendanceUseCase.execute(
        getRequiredParam(request, 'trainingSessionId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  listByEmployee = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.listEmployeeAttendanceUseCase.execute(
        getRequiredParam(request, 'employeeId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  metrics = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.calculateAttendanceMetricsUseCase.execute(
        getRequiredParam(request, 'attendanceId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );
}
