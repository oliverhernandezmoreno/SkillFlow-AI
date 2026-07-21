import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export interface OtecValidatedLocals {
  validatedQuery?: unknown;
  validatedParams?: unknown;
}

export function validateOtecBody(schema: ZodType<unknown>): RequestHandler {
  return (request, _response, next) => {
    request.body = schema.parse(request.body);
    next();
  };
}

export function validateOtecQuery(schema: ZodType<unknown>): RequestHandler {
  return (request, response, next) => {
    response.locals['validatedQuery'] = schema.parse(request.query);
    next();
  };
}

export function validateOtecParams(schema: ZodType<unknown>): RequestHandler {
  return (request, response, next) => {
    response.locals['validatedParams'] = schema.parse(request.params);
    next();
  };
}
