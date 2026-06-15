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
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
} from '../../../application/dto/enrollment.dto.js';
import type { CancelEnrollmentUseCase } from '../../../application/use-cases/cancel-enrollment.use-case.js';
import type { CompleteEnrollmentUseCase } from '../../../application/use-cases/complete-enrollment.use-case.js';
import type { ConfirmEnrollmentUseCase } from '../../../application/use-cases/confirm-enrollment.use-case.js';
import type { CreateEnrollmentUseCase } from '../../../application/use-cases/create-enrollment.use-case.js';
import type { GetEnrollmentUseCase } from '../../../application/use-cases/get-enrollment.use-case.js';
import type { ListEmployeeEnrollmentsUseCase } from '../../../application/use-cases/list-employee-enrollments.use-case.js';
import type { ListEnrollmentsUseCase } from '../../../application/use-cases/list-enrollments.use-case.js';
import type { ListSessionEnrollmentsUseCase } from '../../../application/use-cases/list-session-enrollments.use-case.js';
import type { RejectEnrollmentUseCase } from '../../../application/use-cases/reject-enrollment.use-case.js';
import type { UpdateEnrollmentUseCase } from '../../../application/use-cases/update-enrollment.use-case.js';
import type { EnrollmentStatus } from '../../../domain/entities/enrollment.entity.js';

export class EnrollmentController {
  constructor(
    private readonly listEnrollmentsUseCase: ListEnrollmentsUseCase,
    private readonly createEnrollmentUseCase: CreateEnrollmentUseCase,
    private readonly getEnrollmentUseCase: GetEnrollmentUseCase,
    private readonly updateEnrollmentUseCase: UpdateEnrollmentUseCase,
    private readonly confirmEnrollmentUseCase: ConfirmEnrollmentUseCase,
    private readonly rejectEnrollmentUseCase: RejectEnrollmentUseCase,
    private readonly cancelEnrollmentUseCase: CancelEnrollmentUseCase,
    private readonly completeEnrollmentUseCase: CompleteEnrollmentUseCase,
    private readonly listSessionEnrollmentsUseCase: ListSessionEnrollmentsUseCase,
    private readonly listEmployeeEnrollmentsUseCase: ListEmployeeEnrollmentsUseCase,
  ) {}

  list = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const organizationId =
        getOptionalQueryString(request, 'organizationId') ?? response.locals.auth?.organizationId;
      if (!organizationId) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await this.listEnrollmentsUseCase.execute(
        {
          organizationId,
          page: getOptionalQueryNumber(request, 'page'),
          pageSize: getOptionalQueryNumber(request, 'pageSize'),
          trainingSessionId: getOptionalQueryString(request, 'trainingSessionId'),
          employeeId: getOptionalQueryString(request, 'employeeId'),
          status: getOptionalQueryString(request, 'status') as EnrollmentStatus | undefined,
        },
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  create = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.createEnrollmentUseCase.execute(
        request.body as CreateEnrollmentDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  get = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.getEnrollmentUseCase.execute(
        getRequiredParam(request, 'enrollmentId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  update = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.updateEnrollmentUseCase.execute(
        getRequiredParam(request, 'enrollmentId'),
        request.body as UpdateEnrollmentDto,
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  confirm = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.confirmEnrollmentUseCase.execute(
        getRequiredParam(request, 'enrollmentId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  reject = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.rejectEnrollmentUseCase.execute(
        getRequiredParam(request, 'enrollmentId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  cancel = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.cancelEnrollmentUseCase.execute(
        getRequiredParam(request, 'enrollmentId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  complete = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.completeEnrollmentUseCase.execute(
        getRequiredParam(request, 'enrollmentId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  listBySession = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.listSessionEnrollmentsUseCase.execute(
        getRequiredParam(request, 'trainingSessionId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  listByEmployee = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.listEmployeeEnrollmentsUseCase.execute(
        getRequiredParam(request, 'employeeId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );
}
