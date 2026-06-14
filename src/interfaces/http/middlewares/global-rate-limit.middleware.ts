import type { NextFunction, Request, Response } from 'express';

import { TooManyRequestsError } from '../../../shared/domain/errors.js';

interface RateLimitState {
  count: number;
  resetAt: number;
}

export function createGlobalRateLimit(options: {
  windowMs: number;
  maxRequests: number;
}): (request: Request, response: Response, next: NextFunction) => void {
  const buckets = new Map<string, RateLimitState>();

  return (request: Request, _response: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = request.ip ?? 'unknown';
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > options.maxRequests) {
      throw new TooManyRequestsError('Too many requests');
    }

    next();
  };
}
