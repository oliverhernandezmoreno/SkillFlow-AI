import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../../../shared/domain/errors.js';

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
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

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  request.log.error({ error }, 'Unhandled request error');

  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal Server Error',
    },
  });
};
