import type { Request, Response } from 'express';

import type { PaginatedResult, PaginationInput } from '../../../../../shared/application/pagination.js';
import type { UseCaseContext } from '../../../../../shared/application/use-case-context.js';
import { asyncHandler } from '../../../../../shared/interfaces/http/async-handler.js';
import type { AuthenticatedLocals } from '../../../../auth/interfaces/http/auth-context.js';
import { createUseCaseContext } from '../../../../auth/interfaces/http/auth-request-context.js';
import { formatVersionEtag, parseIfMatch } from '../contracts/otec-http-concurrency.js';
import { presentOtecResource } from '../contracts/otec-http-presenter.js';

export type OtecHttpResource = Record<string, unknown> & { version: number };
type Input = Record<string, unknown>;
type Query = Input & PaginationInput;

export interface OtecRecordHandlers {
  create(input: Input, context: UseCaseContext): Promise<OtecHttpResource>;
  list(
    filters: Input,
    pagination: PaginationInput,
    context: UseCaseContext,
  ): Promise<PaginatedResult<OtecHttpResource>>;
  get(id: string, context: UseCaseContext): Promise<OtecHttpResource>;
  update(id: string, input: Input, context: UseCaseContext): Promise<OtecHttpResource>;
  deactivate?: (id: string, input: Input, context: UseCaseContext) => Promise<OtecHttpResource>;
  suspend?: (id: string, input: Input, context: UseCaseContext) => Promise<OtecHttpResource>;
  revoke?: (id: string, input: Input, context: UseCaseContext) => Promise<OtecHttpResource>;
  supersede?: (
    input: Input,
    context: UseCaseContext,
  ) => Promise<{ response: Input; version: number }>;
  mapFilters?: (query: Query) => Input;
}

export class OtecRecordController {
  constructor(private readonly handlers: OtecRecordHandlers) {}

  create = asyncHandler(async (request, response): Promise<void> => {
    const result = await this.handlers.create(body(request), context(request, response));
    sendVersioned(response, 201, result);
  });

  list = asyncHandler(async (request, response): Promise<void> => {
    const query = validatedQuery(response);
    const pagination = { page: query.page, pageSize: query.pageSize };
    const filters = this.handlers.mapFilters?.(query) ?? withoutPagination(query);
    const result = await this.handlers.list(filters, pagination, context(request, response));
    response.status(200).json(presentOtecResource(result as unknown as Record<string, unknown>));
  });

  get = asyncHandler(async (request, response): Promise<void> => {
    const result = await this.handlers.get(id(response), context(request, response));
    sendVersioned(response, 200, result);
  });

  update = asyncHandler(async (request, response): Promise<void> => {
    const result = await this.handlers.update(
      id(response),
      { ...body(request), expectedVersion: parseIfMatch(request.header('if-match')) },
      context(request, response),
    );
    sendVersioned(response, 200, result);
  });

  deactivate = this.transitionHandler('deactivate');
  suspend = this.transitionHandler('suspend');
  revoke = this.transitionHandler('revoke');

  supersede = asyncHandler(async (request, response): Promise<void> => {
    const input = body(request);
    const replacementTag = input['replacementIfMatch'];
    const result = await required(this.handlers.supersede)(
      {
        replacedResolutionId: id(response),
        replacementResolutionId: input['replacementResolutionId'],
        replacedExpectedVersion: parseIfMatch(request.header('if-match')),
        replacementExpectedVersion: parseIfMatch(
          typeof replacementTag === 'string' ? replacementTag : undefined,
        ),
        ...(input['reason'] === undefined ? {} : { reason: input['reason'] }),
      },
      context(request, response),
    );
    response
      .status(200)
      .set('ETag', formatVersionEtag(result.version))
      .json(presentOtecResource(result.response));
  });

  private transitionHandler(name: 'deactivate' | 'suspend' | 'revoke') {
    return asyncHandler(async (request, response): Promise<void> => {
      const result = await required(this.handlers[name])(
        id(response),
        { ...body(request), expectedVersion: parseIfMatch(request.header('if-match')) },
        context(request, response),
      );
      sendVersioned(response, 200, result);
    });
  }
}

function required<T>(value: T | undefined): T {
  if (!value) throw new Error('OTEC record use case is not configured');
  return value;
}

function body(request: Request): Input {
  return request.body as Input;
}

function context(request: Request, response: Response): UseCaseContext {
  return createUseCaseContext(request, response as Response<unknown, AuthenticatedLocals>);
}

function validatedQuery(response: Response): Query {
  return response.locals['validatedQuery'] as Query;
}

function id(response: Response): string {
  return (response.locals['validatedParams'] as { id: string }).id;
}

function withoutPagination(query: Query): Input {
  return Object.fromEntries(
    Object.entries(query).filter(([key]) => key !== 'page' && key !== 'pageSize'),
  );
}

function sendVersioned(response: Response, status: number, result: OtecHttpResource): void {
  response
    .status(status)
    .set('ETag', formatVersionEtag(result.version))
    .json(presentOtecResource(result));
}
