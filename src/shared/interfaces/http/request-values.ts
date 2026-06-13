import type { Request } from 'express';

import { BadRequestError } from '../../domain/errors.js';

export function getRequiredParam(request: Request, name: string): string {
  const value = request.params[name];
  if (!value) {
    throw new BadRequestError(`Missing route parameter: ${name}`);
  }

  return value;
}

export function getOptionalQueryString(request: Request, name: string): string | undefined {
  const value = request.query[name];
  return typeof value === 'string' ? value : undefined;
}

export function getOptionalQueryNumber(request: Request, name: string): number | undefined {
  const value = getOptionalQueryString(request, name);
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
