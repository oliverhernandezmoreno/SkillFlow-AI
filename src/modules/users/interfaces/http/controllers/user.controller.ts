import type { Request, Response } from 'express';

import { createUseCaseContext } from '../../../../auth/interfaces/http/auth-request-context.js';
import type { AuthenticatedLocals } from '../../../../auth/interfaces/http/auth-context.js';
import { ForbiddenError, UnauthorizedError } from '../../../../../shared/domain/errors.js';
import { asyncHandler } from '../../../../../shared/interfaces/http/async-handler.js';
import {
  getOptionalQueryNumber,
  getOptionalQueryString,
  getRequiredParam,
} from '../../../../../shared/interfaces/http/request-values.js';
import type { CreateUserDto, UpdateUserDto } from '../../../application/dto/user.dto.js';
import type { CreateUserUseCase } from '../../../application/use-cases/create-user.use-case.js';
import type { DeactivateUserUseCase } from '../../../application/use-cases/deactivate-user.use-case.js';
import type { GetUserUseCase } from '../../../application/use-cases/get-user.use-case.js';
import type { ListUsersUseCase } from '../../../application/use-cases/list-users.use-case.js';
import type { UpdateUserUseCase } from '../../../application/use-cases/update-user.use-case.js';

export class UserController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deactivateUserUseCase: DeactivateUserUseCase,
  ) {}

  list = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const organizationId = getRequestedOrganizationId(request, response);
      const result = await this.listUsersUseCase.execute({
        organizationId,
        page: getOptionalQueryNumber(request, 'page'),
        pageSize: getOptionalQueryNumber(request, 'pageSize'),
        search: getOptionalQueryString(request, 'search'),
      });
      response.status(200).json(result);
    },
  );

  create = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const input = request.body as CreateUserDto;
      assertTenantAccess(input.organizationId, response);
      const result = await this.createUserUseCase.execute(
        input,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  get = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.getUserUseCase.execute(
        getRequiredParam(request, 'userId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  update = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.updateUserUseCase.execute(
        getRequiredParam(request, 'userId'),
        request.body as UpdateUserDto,
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  deactivate = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      await this.deactivateUserUseCase.execute(
        getRequiredParam(request, 'userId'),
        createUseCaseContext(request, response),
      );
      response.status(204).send();
    },
  );
}

function getRequestedOrganizationId(
  request: Request,
  response: Response<unknown, AuthenticatedLocals>,
): string {
  const authOrganizationId = response.locals.auth?.organizationId;
  if (!authOrganizationId) {
    throw new UnauthorizedError('Authentication required');
  }

  const requestedOrganizationId = getOptionalQueryString(request, 'organizationId');
  if (requestedOrganizationId && requestedOrganizationId !== authOrganizationId) {
    throw new ForbiddenError('Organization access denied');
  }

  return authOrganizationId;
}

function assertTenantAccess(
  organizationId: string,
  response: Response<unknown, AuthenticatedLocals>,
): void {
  const authOrganizationId = response.locals.auth?.organizationId;
  if (!authOrganizationId) {
    throw new UnauthorizedError('Authentication required');
  }

  if (organizationId !== authOrganizationId) {
    throw new ForbiddenError('Organization access denied');
  }
}
