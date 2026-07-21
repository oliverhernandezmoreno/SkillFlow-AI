import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { mapOtecHttpError } from '../contracts/otec-http-error-mapper.js';

export const otecHttpErrorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.issues,
      },
    });
    return;
  }
  const mapped = mapOtecHttpError(error);
  if (mapped.status === 500) request.log.error({ error }, 'Unhandled OTEC Compliance request error');
  response.status(mapped.status).json(mapped.body);
};
