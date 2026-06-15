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
  CreateTrainingSessionDto,
  UpdateTrainingSessionDto,
} from '../../../application/dto/training-session.dto.js';
import type { CreateTrainingSessionUseCase } from '../../../application/use-cases/create-training-session.use-case.js';
import type { GetTrainingSessionUseCase } from '../../../application/use-cases/get-training-session.use-case.js';
import type { ListTrainingSessionsUseCase } from '../../../application/use-cases/list-training-sessions.use-case.js';
import type { PublishTrainingSessionUseCase } from '../../../application/use-cases/publish-training-session.use-case.js';
import type { UpdateTrainingSessionUseCase } from '../../../application/use-cases/update-training-session.use-case.js';
import type { TrainingSessionStatus } from '../../../domain/entities/training-session.entity.js';

export class TrainingSessionController {
  constructor(
    private readonly listTrainingSessionsUseCase: ListTrainingSessionsUseCase,
    private readonly createTrainingSessionUseCase: CreateTrainingSessionUseCase,
    private readonly getTrainingSessionUseCase: GetTrainingSessionUseCase,
    private readonly updateTrainingSessionUseCase: UpdateTrainingSessionUseCase,
    private readonly publishTrainingSessionUseCase: PublishTrainingSessionUseCase,
  ) {}

  list = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const organizationId =
        getOptionalQueryString(request, 'organizationId') ?? response.locals.auth?.organizationId;
      if (!organizationId) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await this.listTrainingSessionsUseCase.execute(
        {
          organizationId,
          page: getOptionalQueryNumber(request, 'page'),
          pageSize: getOptionalQueryNumber(request, 'pageSize'),
          courseId: getOptionalQueryString(request, 'courseId'),
          status: getOptionalQueryString(request, 'status') as TrainingSessionStatus | undefined,
          from: parseOptionalDate(getOptionalQueryString(request, 'from')),
          to: parseOptionalDate(getOptionalQueryString(request, 'to')),
        },
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  create = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.createTrainingSessionUseCase.execute(
        request.body as CreateTrainingSessionDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  get = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.getTrainingSessionUseCase.execute(
        getRequiredParam(request, 'trainingSessionId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  update = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.updateTrainingSessionUseCase.execute(
        getRequiredParam(request, 'trainingSessionId'),
        request.body as UpdateTrainingSessionDto,
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  publish = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.publishTrainingSessionUseCase.execute(
        getRequiredParam(request, 'trainingSessionId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );
}

function parseOptionalDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}
