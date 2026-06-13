import type { Request, Response } from 'express';

import { asyncHandler } from '../../../../../shared/interfaces/http/async-handler.js';
import { createUseCaseContext } from '../../../../auth/interfaces/http/auth-request-context.js';
import type { AuthenticatedLocals } from '../../../../auth/interfaces/http/auth-context.js';
import {
  getOptionalQueryNumber,
  getOptionalQueryString,
  getRequiredParam,
} from '../../../../../shared/interfaces/http/request-values.js';
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from '../../../application/dto/organization.dto.js';
import type { CreateOrganizationUseCase } from '../../../application/use-cases/create-organization.use-case.js';
import type { DeactivateOrganizationUseCase } from '../../../application/use-cases/deactivate-organization.use-case.js';
import type { GetOrganizationUseCase } from '../../../application/use-cases/get-organization.use-case.js';
import type { ListOrganizationsUseCase } from '../../../application/use-cases/list-organizations.use-case.js';
import type { UpdateOrganizationUseCase } from '../../../application/use-cases/update-organization.use-case.js';

export class OrganizationController {
  constructor(
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly getOrganizationUseCase: GetOrganizationUseCase,
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
    private readonly deactivateOrganizationUseCase: DeactivateOrganizationUseCase,
  ) {}

  list = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const result = await this.listOrganizationsUseCase.execute({
      page: getOptionalQueryNumber(request, 'page'),
      pageSize: getOptionalQueryNumber(request, 'pageSize'),
      search: getOptionalQueryString(request, 'search'),
    });

    response.status(200).json(result);
  });

  create = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.createOrganizationUseCase.execute(
        request.body as CreateOrganizationDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  get = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const result = await this.getOrganizationUseCase.execute(
      getRequiredParam(request, 'organizationId'),
    );
    response.status(200).json(result);
  });

  update = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.updateOrganizationUseCase.execute(
        getRequiredParam(request, 'organizationId'),
        request.body as UpdateOrganizationDto,
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  deactivate = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      await this.deactivateOrganizationUseCase.execute(
        getRequiredParam(request, 'organizationId'),
        createUseCaseContext(request, response),
      );
      response.status(204).send();
    },
  );
}
