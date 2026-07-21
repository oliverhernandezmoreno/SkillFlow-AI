import type { Request, Response } from 'express';

import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../../shared/application/pagination.js';
import type { UseCaseContext } from '../../../../../shared/application/use-case-context.js';
import { asyncHandler } from '../../../../../shared/interfaces/http/async-handler.js';
import type { AuthenticatedLocals } from '../../../../auth/interfaces/http/auth-context.js';
import { createUseCaseContext } from '../../../../auth/interfaces/http/auth-request-context.js';
import { presentOtecReadiness, presentOtecResource } from '../contracts/otec-http-presenter.js';

type Input = Record<string, unknown>;
type Output = Record<string, unknown>;

export interface OtecComplianceQueryHandlers {
  evaluate(input: Input, context: UseCaseContext): Promise<Output>;
  summary(input: Input, context: UseCaseContext): Promise<Output>;
  expiring(
    input: Input,
    pagination: PaginationInput,
    context: UseCaseContext,
  ): Promise<PaginatedResult<Output>>;
}

export class OtecComplianceQueryController {
  constructor(private readonly handlers: OtecComplianceQueryHandlers) {}

  evaluate = asyncHandler(async (request, response): Promise<void> => {
    const result = await this.handlers.evaluate(body(request), context(request, response));
    response.status(200).json(presentOtecReadiness(result));
  });

  summary = asyncHandler(async (request, response): Promise<void> => {
    const result = await this.handlers.summary(query(response), context(request, response));
    response.status(200).json(presentOtecResource(result));
  });

  expiring = asyncHandler(async (request, response): Promise<void> => {
    const validated = query(response) as Input & PaginationInput;
    const { page, pageSize, ...input } = validated;
    const result = await this.handlers.expiring(
      input,
      { page, pageSize },
      context(request, response),
    );
    response.status(200).json(presentOtecResource(result as unknown as Record<string, unknown>));
  });
}

function body(request: Request): Input {
  return request.body as Input;
}

function query(response: Response): Input {
  return response.locals['validatedQuery'] as Input;
}

function context(request: Request, response: Response): UseCaseContext {
  return createUseCaseContext(request, response as Response<unknown, AuthenticatedLocals>);
}
