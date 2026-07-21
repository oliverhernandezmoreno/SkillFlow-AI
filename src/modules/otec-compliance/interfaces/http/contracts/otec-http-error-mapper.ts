import {
  AppError,
  ModuleUnavailableError,
  NotFoundError,
} from '../../../../../shared/domain/errors.js';

export interface OtecHttpErrorContract {
  status: number;
  body: { error: { code: string; message: string } };
}

export function mapOtecHttpError(error: unknown): OtecHttpErrorContract {
  if (error instanceof NotFoundError) return response(404, 'NOT_FOUND', 'Resource not found');
  if (error instanceof ModuleUnavailableError)
    return response(403, error.code, 'OTEC Compliance module unavailable');
  if (error instanceof AppError) return response(error.statusCode, error.code, safeMessage(error));
  return response(500, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
}

function response(status: number, code: string, message: string): OtecHttpErrorContract {
  return { status, body: { error: { code, message } } };
}

function safeMessage(error: AppError): string {
  if (error.code === 'FORBIDDEN') return 'Permission denied';
  if (error.code === 'CONFLICT') return 'The operation conflicts with current state';
  if (error.code === 'BAD_REQUEST') return 'Request validation failed';
  return error.message;
}
