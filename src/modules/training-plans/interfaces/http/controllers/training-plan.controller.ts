import type { Request, Response } from 'express';

import { createUseCaseContext } from '../../../../auth/interfaces/http/auth-request-context.js';
import type { AuthenticatedLocals } from '../../../../auth/interfaces/http/auth-context.js';
import { UnauthorizedError } from '../../../../../shared/domain/errors.js';
import { asyncHandler } from '../../../../../shared/interfaces/http/async-handler.js';
import {
  getOptionalQueryNumber,
  getOptionalQueryString,
  getRequiredParam,
} from '../../../../../shared/interfaces/http/request-values.js';
import type {
  CreateTrainingPlanDto,
  CreateTrainingPlanItemDto,
  UpdateTrainingPlanDto,
} from '../../../application/dto/training-plan.dto.js';
import type { ApproveTrainingPlanUseCase } from '../../../application/use-cases/approve-training-plan.use-case.js';
import type { CreateTrainingPlanItemUseCase } from '../../../application/use-cases/create-training-plan-item.use-case.js';
import type { CreateTrainingPlanUseCase } from '../../../application/use-cases/create-training-plan.use-case.js';
import type { GetTrainingPlanUseCase } from '../../../application/use-cases/get-training-plan.use-case.js';
import type { ListTrainingPlansUseCase } from '../../../application/use-cases/list-training-plans.use-case.js';
import type { RejectTrainingPlanUseCase } from '../../../application/use-cases/reject-training-plan.use-case.js';
import type { UpdateTrainingPlanUseCase } from '../../../application/use-cases/update-training-plan.use-case.js';
import { parseTrainingPlanStatus } from '../validators/training-plan.validators.js';

export class TrainingPlanController {
  constructor(
    private readonly listTrainingPlansUseCase: ListTrainingPlansUseCase,
    private readonly createTrainingPlanUseCase: CreateTrainingPlanUseCase,
    private readonly getTrainingPlanUseCase: GetTrainingPlanUseCase,
    private readonly updateTrainingPlanUseCase: UpdateTrainingPlanUseCase,
    private readonly approveTrainingPlanUseCase: ApproveTrainingPlanUseCase,
    private readonly rejectTrainingPlanUseCase: RejectTrainingPlanUseCase,
    private readonly createTrainingPlanItemUseCase: CreateTrainingPlanItemUseCase,
  ) {}

  list = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const organizationId =
        getOptionalQueryString(request, 'organizationId') ?? response.locals.auth?.organizationId;
      if (!organizationId) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await this.listTrainingPlansUseCase.execute(
        {
          organizationId,
          year: getOptionalQueryNumber(request, 'year'),
          status: parseTrainingPlanStatus(getOptionalQueryString(request, 'status')),
          page: getOptionalQueryNumber(request, 'page'),
          pageSize: getOptionalQueryNumber(request, 'pageSize'),
        },
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  create = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.createTrainingPlanUseCase.execute(
        request.body as CreateTrainingPlanDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  get = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.getTrainingPlanUseCase.execute(
        getRequiredParam(request, 'trainingPlanId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  update = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.updateTrainingPlanUseCase.execute(
        getRequiredParam(request, 'trainingPlanId'),
        request.body as UpdateTrainingPlanDto,
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  approve = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.approveTrainingPlanUseCase.execute(
        getRequiredParam(request, 'trainingPlanId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  reject = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.rejectTrainingPlanUseCase.execute(
        getRequiredParam(request, 'trainingPlanId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  createItem = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.createTrainingPlanItemUseCase.execute(
        getRequiredParam(request, 'trainingPlanId'),
        request.body as CreateTrainingPlanItemDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );
}
