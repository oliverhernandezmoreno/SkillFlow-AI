import type { Request, Response } from 'express';

import type { UseCaseContext } from '../../../../../shared/application/use-case-context.js';
import { asyncHandler } from '../../../../../shared/interfaces/http/async-handler.js';
import type { AuthenticatedLocals } from '../../../../auth/interfaces/http/auth-context.js';
import { createUseCaseContext } from '../../../../auth/interfaces/http/auth-request-context.js';
import type {
  CreateOtecProfileDto,
  DeactivateOtecProfileDto,
  OtecProfileDto,
  UpdateOtecProfileDto,
} from '../../../application/dto/otec-profile.dto.js';
import { formatVersionEtag, parseIfMatch } from '../contracts/otec-http-concurrency.js';
import { presentOtecResource } from '../contracts/otec-http-presenter.js';

interface ProfileUseCases {
  create?: {
    execute(input: CreateOtecProfileDto, context: UseCaseContext): Promise<OtecProfileDto>;
  };
  get?: { execute(context: UseCaseContext): Promise<OtecProfileDto> };
  update?: {
    execute(input: UpdateOtecProfileDto, context: UseCaseContext): Promise<OtecProfileDto>;
  };
  deactivate?: {
    execute(input: DeactivateOtecProfileDto, context: UseCaseContext): Promise<void>;
  };
}

export class OtecProfileController {
  constructor(private readonly useCases: ProfileUseCases) {}

  create = asyncHandler(async (request, response): Promise<void> => {
    const result = await required(this.useCases.create).execute(
      request.body as CreateOtecProfileDto,
      context(request, response),
    );
    sendVersioned(response, 201, result);
  });

  get = asyncHandler(async (request, response): Promise<void> => {
    const result = await required(this.useCases.get).execute(context(request, response));
    sendVersioned(response, 200, result);
  });

  update = asyncHandler(async (request, response): Promise<void> => {
    const result = await required(this.useCases.update).execute(
      { ...(request.body as CreateOtecProfileDto), expectedVersion: parseIfMatch(request.header('if-match')) },
      context(request, response),
    );
    sendVersioned(response, 200, result);
  });

  deactivate = asyncHandler(async (request, response): Promise<void> => {
    await required(this.useCases.deactivate).execute(
      { expectedVersion: parseIfMatch(request.header('if-match')) },
      context(request, response),
    );
    response.status(204).send();
  });
}

function required<T>(value: T | undefined): T {
  if (!value) throw new Error('OTEC profile use case is not configured');
  return value;
}

function context(request: Request, response: Response): UseCaseContext {
  return createUseCaseContext(request, response as Response<unknown, AuthenticatedLocals>);
}

function sendVersioned(response: Response, status: number, result: OtecProfileDto): void {
  response
    .status(status)
    .set('ETag', formatVersionEtag(result.version))
    .json(presentOtecResource(result as unknown as Record<string, unknown>));
}
