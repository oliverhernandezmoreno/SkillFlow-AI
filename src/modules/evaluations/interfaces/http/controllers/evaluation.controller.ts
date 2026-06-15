import type { Request, Response } from 'express';

import type { AuthenticatedLocals } from '../../../../auth/interfaces/http/auth-context.js';
import { createUseCaseContext } from '../../../../auth/interfaces/http/auth-request-context.js';
import { BadRequestError, UnauthorizedError } from '../../../../../shared/domain/errors.js';
import { asyncHandler } from '../../../../../shared/interfaces/http/async-handler.js';
import {
  getOptionalQueryNumber,
  getOptionalQueryString,
  getRequiredParam,
} from '../../../../../shared/interfaces/http/request-values.js';
import type {
  CreateEvaluationDto,
  CreateEvaluationQuestionDto,
  SubmitEvaluationAnswerDto,
  SubmitEvaluationDto,
  UpdateEvaluationDto,
  UpdateEvaluationQuestionDto,
} from '../../../application/dto/evaluation.dto.js';
import type { AddEvaluationQuestionUseCase } from '../../../application/use-cases/add-evaluation-question.use-case.js';
import type { CalculateEvaluationResultUseCase } from '../../../application/use-cases/calculate-evaluation-result.use-case.js';
import type { CloseEvaluationUseCase } from '../../../application/use-cases/close-evaluation.use-case.js';
import type { CreateEvaluationUseCase } from '../../../application/use-cases/create-evaluation.use-case.js';
import type { GetEvaluationUseCase } from '../../../application/use-cases/get-evaluation.use-case.js';
import type { ListEmployeeEvaluationsUseCase } from '../../../application/use-cases/list-employee-evaluations.use-case.js';
import type { ListEnrollmentEvaluationsUseCase } from '../../../application/use-cases/list-enrollment-evaluations.use-case.js';
import type { ListEvaluationsUseCase } from '../../../application/use-cases/list-evaluations.use-case.js';
import type { ListSessionEvaluationsUseCase } from '../../../application/use-cases/list-session-evaluations.use-case.js';
import type { SubmitEvaluationAnswerUseCase } from '../../../application/use-cases/submit-evaluation-answer.use-case.js';
import type { SubmitEvaluationUseCase } from '../../../application/use-cases/submit-evaluation.use-case.js';
import type { UpdateEvaluationQuestionUseCase } from '../../../application/use-cases/update-evaluation-question.use-case.js';
import type { UpdateEvaluationUseCase } from '../../../application/use-cases/update-evaluation.use-case.js';
import type { EvaluationType } from '../../../domain/entities/evaluation.entity.js';

export class EvaluationController {
  constructor(
    private readonly listEvaluationsUseCase: ListEvaluationsUseCase,
    private readonly createEvaluationUseCase: CreateEvaluationUseCase,
    private readonly getEvaluationUseCase: GetEvaluationUseCase,
    private readonly updateEvaluationUseCase: UpdateEvaluationUseCase,
    private readonly addEvaluationQuestionUseCase: AddEvaluationQuestionUseCase,
    private readonly updateEvaluationQuestionUseCase: UpdateEvaluationQuestionUseCase,
    private readonly submitEvaluationUseCase: SubmitEvaluationUseCase,
    private readonly submitEvaluationAnswerUseCase: SubmitEvaluationAnswerUseCase,
    private readonly closeEvaluationUseCase: CloseEvaluationUseCase,
    private readonly listSessionEvaluationsUseCase: ListSessionEvaluationsUseCase,
    private readonly listEmployeeEvaluationsUseCase: ListEmployeeEvaluationsUseCase,
    private readonly listEnrollmentEvaluationsUseCase: ListEnrollmentEvaluationsUseCase,
    private readonly calculateEvaluationResultUseCase: CalculateEvaluationResultUseCase,
  ) {}

  list = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const organizationId =
        getOptionalQueryString(request, 'organizationId') ?? response.locals.auth?.organizationId;
      if (!organizationId) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await this.listEvaluationsUseCase.execute(
        {
          organizationId,
          page: getOptionalQueryNumber(request, 'page'),
          pageSize: getOptionalQueryNumber(request, 'pageSize'),
          trainingSessionId: getOptionalQueryString(request, 'trainingSessionId'),
          enrollmentId: getOptionalQueryString(request, 'enrollmentId'),
          employeeId: getOptionalQueryString(request, 'employeeId'),
          type: getOptionalQueryString(request, 'type') as EvaluationType | undefined,
        },
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  create = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.createEvaluationUseCase.execute(
        request.body as CreateEvaluationDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  get = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.getEvaluationUseCase.execute(
        getRequiredParam(request, 'evaluationId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  update = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.updateEvaluationUseCase.execute(
        getRequiredParam(request, 'evaluationId'),
        request.body as UpdateEvaluationDto,
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  addQuestion = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.addEvaluationQuestionUseCase.execute(
        getRequiredParam(request, 'evaluationId'),
        request.body as CreateEvaluationQuestionDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  updateQuestion = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.updateEvaluationQuestionUseCase.execute(
        getRequiredParam(request, 'evaluationId'),
        getRequiredParam(request, 'questionId'),
        request.body as UpdateEvaluationQuestionDto,
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  submit = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.submitEvaluationUseCase.execute(
        getRequiredParam(request, 'evaluationId'),
        request.body as SubmitEvaluationDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  submitAnswer = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.submitEvaluationAnswerUseCase.execute(
        getRequiredParam(request, 'evaluationId'),
        request.body as SubmitEvaluationAnswerDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  close = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.closeEvaluationUseCase.execute(
        getRequiredParam(request, 'evaluationId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  listBySession = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.listSessionEvaluationsUseCase.execute(
        getRequiredParam(request, 'trainingSessionId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  listByEmployee = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.listEmployeeEvaluationsUseCase.execute(
        getRequiredParam(request, 'employeeId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  listByEnrollment = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.listEnrollmentEvaluationsUseCase.execute(
        getRequiredParam(request, 'enrollmentId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  result = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const employeeId = getOptionalQueryString(request, 'employeeId');
      if (!employeeId) {
        throw new BadRequestError('employeeId query parameter is required');
      }
      const result = await this.calculateEvaluationResultUseCase.execute(
        getRequiredParam(request, 'evaluationId'),
        { employeeId },
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );
}
