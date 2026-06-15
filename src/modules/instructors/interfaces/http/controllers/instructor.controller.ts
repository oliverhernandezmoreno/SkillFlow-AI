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
  CreateInstructorDto,
  UpdateInstructorDto,
} from '../../../application/dto/instructor.dto.js';
import type { CreateInstructorUseCase } from '../../../application/use-cases/create-instructor.use-case.js';
import type { GetInstructorUseCase } from '../../../application/use-cases/get-instructor.use-case.js';
import type { ListInstructorsUseCase } from '../../../application/use-cases/list-instructors.use-case.js';
import type { UpdateInstructorUseCase } from '../../../application/use-cases/update-instructor.use-case.js';
import type { InstructorStatus } from '../../../domain/entities/instructor.entity.js';

export class InstructorController {
  constructor(
    private readonly listInstructorsUseCase: ListInstructorsUseCase,
    private readonly createInstructorUseCase: CreateInstructorUseCase,
    private readonly getInstructorUseCase: GetInstructorUseCase,
    private readonly updateInstructorUseCase: UpdateInstructorUseCase,
  ) {}

  list = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const organizationId =
        getOptionalQueryString(request, 'organizationId') ?? response.locals.auth?.organizationId;
      if (!organizationId) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await this.listInstructorsUseCase.execute(
        {
          organizationId,
          page: getOptionalQueryNumber(request, 'page'),
          pageSize: getOptionalQueryNumber(request, 'pageSize'),
          search: getOptionalQueryString(request, 'search'),
          status: getOptionalQueryString(request, 'status') as InstructorStatus | undefined,
          providerId: getOptionalQueryString(request, 'providerId'),
        },
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  create = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.createInstructorUseCase.execute(
        request.body as CreateInstructorDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  get = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.getInstructorUseCase.execute(
        getRequiredParam(request, 'instructorId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  update = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.updateInstructorUseCase.execute(
        getRequiredParam(request, 'instructorId'),
        request.body as UpdateInstructorDto,
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );
}
